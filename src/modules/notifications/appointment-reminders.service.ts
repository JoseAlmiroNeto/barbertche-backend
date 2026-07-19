import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Interval } from "@nestjs/schedule";
import { AppointmentStatus, NotificationCategory } from "@prisma/client";
import { fromDbDate } from "../../storage/prisma-mappers";
import { PrismaService } from "../../storage/prisma.service";
import { NotificationQueueService } from "./notification-queue.service";

@Injectable()
export class AppointmentRemindersService {
  private running = false;
  private readonly timeZone: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: NotificationQueueService,
    config: ConfigService,
  ) {
    this.timeZone = config.get<string>("APP_TIME_ZONE") ?? "America/Sao_Paulo";
  }

  @Interval("appointment-reminders", 5 * 60_000)
  async enqueueDueReminders(now = new Date()) {
    if (this.running) return;
    this.running = true;
    try {
      const dates = [this.localDate(now), this.localDate(new Date(now.getTime() + 24 * 60 * 60_000))];
      const appointments = await this.prisma.appointment.findMany({
        where: { date: { gte: new Date(`${dates[0]}T00:00:00.000Z`), lte: new Date(`${dates[1]}T00:00:00.000Z`) }, status: AppointmentStatus.SCHEDULED },
        include: { service: true, client: { include: { user: { select: { id: true } } } } },
      });
      for (const appointment of appointments) {
        const userId = appointment.client?.user?.id;
        if (!userId) continue;
        const date = fromDbDate(appointment.date);
        const startsAt = this.zonedDateTime(date, appointment.start);
        const delay = startsAt.getTime() - now.getTime();
        if (delay < 23 * 60 * 60_000 || delay > 25 * 60 * 60_000) continue;
        await this.queue.enqueue(userId, {
          category: NotificationCategory.REMINDER,
          title: "Lembrete de agendamento",
          body: `${appointment.service.name} amanhã às ${appointment.start}.`,
          data: { type: "appointment_reminder", appointmentId: appointment.id },
          idempotencyKey: `appointment-reminder-24h:${appointment.id}`,
        });
      }
    } finally { this.running = false; }
  }

  private localDate(date: Date) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: this.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }

  private zonedDateTime(date: string, time: string) {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    let guess = Date.UTC(year, month - 1, day, hour, minute);
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: this.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute));
    guess -= represented - guess;
    return new Date(guess);
  }
}
