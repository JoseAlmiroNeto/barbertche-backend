import { Injectable, Logger } from "@nestjs/common";
import {
  NotificationCategory,
  NotificationJobStatus,
  NotificationReceiptStatus,
  Prisma,
} from "@prisma/client";
import type { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { PrismaService } from "../../storage/prisma.service";
import { ExpoPushClient } from "./expo-push.client";
import { defaultNotificationPreferences } from "./notification-preferences.service";

type QueueMessage = {
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
  idempotencyKey?: string;
  availableAt?: Date;
};

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expo: ExpoPushClient,
  ) {}

  async enqueue(userId: string, message: QueueMessage) {
    try {
      return await this.prisma.notificationJob.create({
        data: { userId, ...message },
      });
    } catch (error) {
      if (message.idempotencyKey && this.isUniqueConstraint(error)) return null;
      throw error;
    }
  }

  async enqueueMany(userIds: string[], message: QueueMessage) {
    await Promise.all([...new Set(userIds)].map((userId) => this.enqueue(userId, message)));
  }

  async processDueJobs(limit = 25) {
    const now = new Date();
    const staleLock = new Date(now.getTime() - 5 * 60_000);
    await this.prisma.notificationJob.updateMany({
      where: { status: NotificationJobStatus.PROCESSING, lockedAt: { lt: staleLock } },
      data: { status: NotificationJobStatus.PENDING, lockedAt: null },
    });
    const jobs = await this.prisma.notificationJob.findMany({
      where: { status: NotificationJobStatus.PENDING, availableAt: { lte: now } },
      orderBy: { availableAt: "asc" },
      take: limit,
      include: {
        user: {
          include: {
            notificationPreference: true,
            pushTokens: {
              where: { session: { revokedAt: null, expiresAt: { gt: now } } },
              select: { token: true },
            },
          },
        },
      },
    });
    for (const job of jobs) await this.processJob(job);
  }

  async processDueReceipts(limit = 300) {
    const receipts = await this.prisma.notificationReceipt.findMany({
      where: { status: NotificationReceiptStatus.PENDING, availableAt: { lte: new Date() } },
      take: limit,
    });
    for (const chunk of this.chunk(receipts, 300)) {
      const result = await this.expo.getReceipts(chunk.map(({ receiptId }) => receiptId));
      for (const receipt of chunk) {
        const expoReceipt = result[receipt.receiptId];
        if (!expoReceipt) {
          await this.rescheduleReceipt(receipt.id, receipt.attempts, "Receipt ainda indisponível");
        } else if (expoReceipt.status === "ok") {
          await this.prisma.notificationReceipt.update({
            where: { id: receipt.id },
            data: { status: NotificationReceiptStatus.DELIVERED, checkedAt: new Date(), attempts: { increment: 1 } },
          });
        } else {
          if (expoReceipt.details?.error === "DeviceNotRegistered") {
            await this.deleteTokens([receipt.token]);
          }
          await this.prisma.notificationReceipt.update({
            where: { id: receipt.id },
            data: {
              status: NotificationReceiptStatus.FAILED,
              checkedAt: new Date(),
              attempts: { increment: 1 },
              error: expoReceipt.details?.error ?? expoReceipt.message,
            },
          });
        }
      }
    }
  }

  private async processJob(job: Awaited<ReturnType<NotificationQueueService["findJobShape"]>>) {
    const claimed = await this.prisma.notificationJob.updateMany({
      where: { id: job.id, status: NotificationJobStatus.PENDING },
      data: { status: NotificationJobStatus.PROCESSING, lockedAt: new Date(), attempts: { increment: 1 } },
    });
    if (!claimed.count) return;
    if (!job.user.active || !this.isEnabled(job.category, job.user.notificationPreference)) {
      await this.completeJob(job.id, "Desativada nas preferências do usuário");
      return;
    }
    const tokens = job.user.pushTokens.map(({ token }) => token);
    const invalidTokens = tokens.filter((token) => !this.expo.isValidToken(token));
    if (invalidTokens.length) await this.deleteTokens(invalidTokens);
    const messages: ExpoPushMessage[] = tokens.filter((token) => this.expo.isValidToken(token)).map((to) => ({
      to,
      title: job.title,
      body: job.body,
      data: (job.data as Record<string, unknown> | null) ?? undefined,
      sound: "default",
      priority: "high",
      channelId: "appointments",
    }));
    if (!messages.length) {
      await this.completeJob(job.id);
      return;
    }
    try {
      for (const chunk of this.expo.chunks(messages)) {
        const tickets = await this.expo.send(chunk);
        await this.persistTickets(job.id, chunk, tickets);
      }
      await this.completeJob(job.id);
    } catch (error) {
      await this.retryJob(job.id, job.attempts + 1, job.maxAttempts, error);
    }
  }

  // Mantém o tipo da consulta centralizado sem expor tipos gerados complexos.
  private findJobShape() {
    return this.prisma.notificationJob.findFirstOrThrow({
      include: { user: { include: { notificationPreference: true, pushTokens: { select: { token: true } } } } },
    });
  }

  private async persistTickets(jobId: string, messages: ExpoPushMessage[], tickets: ExpoPushTicket[]) {
    const invalidTokens: string[] = [];
    for (let index = 0; index < tickets.length; index += 1) {
      const ticket = tickets[index];
      const token = messages[index]?.to;
      if (typeof token !== "string") continue;
      if (ticket.status === "ok") {
        await this.prisma.notificationReceipt.upsert({
          where: { receiptId: ticket.id },
          create: { jobId, token, receiptId: ticket.id, availableAt: new Date(Date.now() + 15 * 60_000) },
          update: {},
        });
      } else if (ticket.details?.error === "DeviceNotRegistered") {
        invalidTokens.push(token);
      } else {
        this.logger.warn(`Expo recusou notificação: ${ticket.details?.error ?? ticket.message}`);
      }
    }
    if (invalidTokens.length) await this.deleteTokens(invalidTokens);
  }

  private completeJob(id: string, note?: string) {
    return this.prisma.notificationJob.update({
      where: { id },
      data: { status: NotificationJobStatus.SENT, sentAt: new Date(), lockedAt: null, lastError: note ?? null },
    });
  }

  private retryJob(id: string, attempts: number, maxAttempts: number, error: unknown) {
    const failed = attempts >= maxAttempts;
    return this.prisma.notificationJob.update({
      where: { id },
      data: {
        status: failed ? NotificationJobStatus.FAILED : NotificationJobStatus.PENDING,
        availableAt: new Date(Date.now() + this.retryDelay(attempts)),
        lockedAt: null,
        lastError: error instanceof Error ? error.message : String(error),
      },
    });
  }

  private async rescheduleReceipt(id: string, attempts: number, error: string) {
    const nextAttempt = attempts + 1;
    await this.prisma.notificationReceipt.update({
      where: { id },
      data: {
        status: nextAttempt >= 8 ? NotificationReceiptStatus.FAILED : NotificationReceiptStatus.PENDING,
        attempts: { increment: 1 },
        availableAt: new Date(Date.now() + this.retryDelay(nextAttempt)),
        error,
      },
    });
  }

  private isEnabled(category: NotificationCategory, preference: { reminders: boolean; appointmentChanges: boolean; promotions: boolean } | null) {
    const value = preference ?? defaultNotificationPreferences;
    if (category === NotificationCategory.REMINDER) return value.reminders;
    if (category === NotificationCategory.PROMOTIONS) return value.promotions;
    return value.appointmentChanges;
  }

  private retryDelay(attempt: number) {
    return Math.min(60 * 60_000, 30_000 * 2 ** Math.max(0, attempt - 1));
  }

  private deleteTokens(tokens: string[]) {
    return this.prisma.pushToken.deleteMany({ where: { token: { in: [...new Set(tokens)] } } });
  }

  private isUniqueConstraint(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }

  private chunk<T>(items: T[], size: number) {
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
  }
}
