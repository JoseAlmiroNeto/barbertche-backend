import { Injectable, Logger } from "@nestjs/common";
import { AppointmentStatus, NotificationCategory, UserRole } from "@prisma/client";
import { mapAppointment } from "../../storage/prisma-mappers";
import { PrismaService } from "../../storage/prisma.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { NotificationQueueService } from "./notification-queue.service";

type AppointmentEvent = "created" | "rescheduled" | "canceled";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: NotificationQueueService,
  ) {}

  async notifyAppointmentEvent(appointmentId: string, event: AppointmentEvent, actorRole: UserRole) {
    try {
      const context = await this.getAppointmentContext(appointmentId);
      if (!context) return;
      const content = this.appointmentEventContent(event, context);
      if (context.userId) {
        await this.queue.enqueue(context.userId, {
          category: NotificationCategory.APPOINTMENT_CHANGES,
          ...content.client,
          data: { type: `appointment_${event}`, appointmentId },
        });
      }
      if (actorRole === UserRole.CLIENT) {
        const admins = await this.prisma.user.findMany({
          where: { role: UserRole.ADMIN, active: true },
          select: { id: true },
        });
        await this.queue.enqueueMany(admins.map(({ id }) => id), {
          category: NotificationCategory.APPOINTMENT_CHANGES,
          ...content.admin,
          data: { type: `appointment_${event}`, appointmentId },
        });
      }
    } catch (error) {
      this.logFailure(`evento ${event}`, appointmentId, error);
    }
  }

  async notifyAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
    try {
      const context = await this.getAppointmentContext(appointmentId);
      if (!context?.userId) return;
      await this.queue.enqueue(context.userId, {
        category: NotificationCategory.APPOINTMENT_CHANGES,
        ...this.statusContent(status, context),
        data: { type: "appointment_status", appointmentId, status },
      });
    } catch (error) {
      this.logFailure(`status ${status}`, appointmentId, error);
    }
  }

  async createPromotion(dto: CreatePromotionDto) {
    const users = await this.prisma.user.findMany({
      where: { active: true },
      select: { id: true },
    });
    await this.queue.enqueueMany(users.map(({ id }) => id), {
      category: NotificationCategory.PROMOTIONS,
      title: dto.title,
      body: dto.body,
      data: { type: "promotion", ...(dto.data ?? {}) },
    });
    return { queued: users.length };
  }

  private async getAppointmentContext(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, client: { include: { user: { select: { id: true } } } } },
    });
    if (!appointment) return null;
    const mapped = mapAppointment(appointment);
    return {
      userId: appointment.client?.user?.id ?? null,
      clientName: appointment.clientName,
      serviceName: appointment.service.name,
      date: mapped.date,
      start: appointment.start,
      cancellationReason: appointment.cancellationReason,
    };
  }

  private appointmentEventContent(event: AppointmentEvent, context: NonNullable<Awaited<ReturnType<typeof this.getAppointmentContext>>>) {
    const schedule = `${context.serviceName} em ${this.formatDate(context.date)} às ${context.start}.`;
    if (event === "created") return { client: { title: "Agendamento confirmado", body: schedule }, admin: { title: "Novo agendamento", body: `${context.clientName}: ${schedule}` } };
    if (event === "rescheduled") return { client: { title: "Agendamento remarcado", body: schedule }, admin: { title: "Agendamento remarcado pelo cliente", body: `${context.clientName}: ${schedule}` } };
    return {
      client: { title: "Agendamento cancelado", body: `O atendimento de ${context.serviceName} foi cancelado.` },
      admin: { title: "Agendamento cancelado pelo cliente", body: `${context.clientName} cancelou ${context.serviceName} em ${this.formatDate(context.date)} às ${context.start}.` },
    };
  }

  private statusContent(status: AppointmentStatus, context: NonNullable<Awaited<ReturnType<typeof this.getAppointmentContext>>>) {
    const contents: Record<AppointmentStatus, { title: string; body: string }> = {
      SCHEDULED: { title: "Agendamento reaberto", body: `${context.serviceName} em ${this.formatDate(context.date)} às ${context.start}.` },
      COMPLETED: { title: "Atendimento concluído", body: `Seu atendimento de ${context.serviceName} foi concluído.` },
      CANCELED: { title: "Agendamento cancelado", body: context.cancellationReason ?? `Seu atendimento de ${context.serviceName} foi cancelado.` },
      NO_SHOW: { title: "Ausência registrada", body: `Foi registrada ausência no atendimento de ${context.serviceName}.` },
    };
    return contents[status];
  }

  private logFailure(event: string, appointmentId: string, error: unknown) {
    this.logger.error(`Falha ao enfileirar ${event} do agendamento ${appointmentId}.`, error instanceof Error ? error.stack : String(error));
  }

  private formatDate(date: string) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }
}
