import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AppointmentSource, Prisma } from "@prisma/client";
import { addMinutes, overlaps, toMinutes, toTime, weekdayOf } from "../../domain/time";
import type { Interval } from "../../domain/types";
import { mapAppointment, mapRecurringBooking, toDbDate } from "../../storage/prisma-mappers";
import { PrismaService } from "../../storage/prisma.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { CreateRecurringBookingDto } from "./dto/create-recurring-booking.dto";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";

type Db = PrismaService | Prisma.TransactionClient;
type ActiveService = {
  id: string;
  duration: number;
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(date?: string) {
    if (!date) {
      const appointments = await this.prisma.appointment.findMany({ orderBy: [{ date: "asc" }, { start: "asc" }] });
      return appointments.map(mapAppointment);
    }

    return this.getBookingsForDate(this.prisma, date);
  }

  async getAvailability(date: string, serviceId: string) {
    const service = await this.getService(this.prisma, serviceId);
    const hours = await this.getBusinessHours(this.prisma, weekdayOf(date));
    if (!hours || await this.isClosedDate(this.prisma, date)) {
      return [];
    }

    const slots: string[] = [];
    for (let cursor = toMinutes(hours.open); cursor + service.duration <= toMinutes(hours.close); cursor += 30) {
      const start = toTime(cursor);
      if (await this.canUseSlot(this.prisma, date, start, service)) {
        slots.push(start);
      }
    }
    return slots;
  }

  async create(dto: CreateAppointmentDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockScheduleDate(tx, dto.date);

      const service = await this.getService(tx, dto.serviceId);
      const client = dto.clientId ? await tx.client.findUnique({ where: { id: dto.clientId } }) : undefined;
      const clientName = dto.clientName ?? client?.name;

      if (!clientName) {
        throw new BadRequestException("Informe um cliente cadastrado ou um nome manual.");
      }

      if (!await this.canUseSlot(tx, dto.date, dto.start, service)) {
        throw new ConflictException("Horario indisponivel.");
      }

      const appointment = await tx.appointment.create({
        data: {
          date: toDbDate(dto.date),
          start: dto.start,
          end: addMinutes(dto.start, service.duration),
          clientId: dto.clientId,
          clientName,
          serviceId: service.id,
          source: dto.source === "manual" ? AppointmentSource.manual : AppointmentSource.app
        }
      });

      return mapAppointment(appointment);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockScheduleDate(tx, dto.date);

      const appointment = await this.getAppointment(tx, id);
      if (mapAppointment(appointment).date !== dto.date) {
        await this.lockScheduleDate(tx, mapAppointment(appointment).date);
      }

      const service = await this.getService(tx, appointment.serviceId);
      if (!await this.canUseSlot(tx, dto.date, dto.start, service, id)) {
        throw new ConflictException("Horario indisponivel.");
      }

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          date: toDbDate(dto.date),
          start: dto.start,
          end: addMinutes(dto.start, service.duration)
        }
      });

      return mapAppointment(updated);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async remove(id: string) {
    await this.getAppointment(this.prisma, id);
    await this.prisma.appointment.delete({ where: { id } });
    return { deleted: true };
  }

  async findRecurring() {
    const items = await this.prisma.recurringBooking.findMany({ orderBy: [{ weekday: "asc" }, { start: "asc" }] });
    return items.map(mapRecurringBooking);
  }

  async createRecurring(dto: CreateRecurringBookingDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockRecurringWeekday(tx, dto.weekday);
      const sampleDates = this.nextDatesForWeekday(dto.weekday, 12);
      for (const date of sampleDates) {
        await this.lockScheduleDate(tx, date);
      }

      const service = await this.getService(tx, dto.serviceId);
      const client = await tx.client.findUnique({ where: { id: dto.clientId } });
      if (!client) {
        throw new NotFoundException("Cliente nao encontrado.");
      }

      if (!await this.canUseRecurringSlot(tx, dto.weekday, dto.start, service)) {
        throw new ConflictException("Horario fixo conflita com agenda, bloqueio ou recorrencia.");
      }

      const recurring = await tx.recurringBooking.create({
        data: {
          clientId: dto.clientId,
          serviceId: dto.serviceId,
          weekday: dto.weekday,
          start: dto.start,
          active: dto.active ?? true
        }
      });

      return mapRecurringBooking(recurring);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async updateRecurring(id: string, dto: CreateRecurringBookingDto) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.recurringBooking.findUnique({ where: { id } });
      if (!current) {
        throw new NotFoundException("Agendamento fixo nao encontrado.");
      }

      await this.lockRecurringWeekday(tx, current.weekday);
      if (current.weekday !== dto.weekday) {
        await this.lockRecurringWeekday(tx, dto.weekday);
      }

      const sampleDates = [
        ...this.nextDatesForWeekday(current.weekday, 12),
        ...this.nextDatesForWeekday(dto.weekday, 12)
      ];
      for (const date of new Set(sampleDates)) {
        await this.lockScheduleDate(tx, date);
      }

      const service = await this.getService(tx, dto.serviceId);
      const client = await tx.client.findUnique({ where: { id: dto.clientId } });
      if (!client) {
        throw new NotFoundException("Cliente nao encontrado.");
      }

      if (!await this.canUseRecurringSlot(tx, dto.weekday, dto.start, service, id)) {
        throw new ConflictException("Horario fixo conflita com agenda, bloqueio ou recorrencia.");
      }

      const recurring = await tx.recurringBooking.update({
        where: { id },
        data: {
          clientId: dto.clientId,
          serviceId: dto.serviceId,
          weekday: dto.weekday,
          start: dto.start,
          active: dto.active ?? true
        }
      });

      return mapRecurringBooking(recurring);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async removeRecurring(id: string) {
    const exists = await this.prisma.recurringBooking.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException("Agendamento fixo nao encontrado.");
    }

    await this.prisma.recurringBooking.delete({ where: { id } });
    return { deleted: true };
  }

  private async canUseSlot(db: Db, date: string, start: string, service: ActiveService, ignoreAppointmentId?: string, ignoreRecurringId?: string) {
    const hours = await this.getBusinessHours(db, weekdayOf(date));
    if (!hours || await this.isClosedDate(db, date)) {
      return false;
    }

    const interval = { start, end: addMinutes(start, service.duration) };
    if (toMinutes(interval.start) < toMinutes(hours.open) || toMinutes(interval.end) > toMinutes(hours.close)) {
      return false;
    }

    const busy = await this.getBusyIntervals(db, date, ignoreAppointmentId, ignoreRecurringId);
    return !busy.some((item) => overlaps(interval, item));
  }

  private async canUseRecurringSlot(db: Db, weekday: number, start: string, service: ActiveService, ignoreRecurringId?: string) {
    const hours = await this.getBusinessHours(db, weekday);
    if (!hours) {
      return false;
    }

    const interval = { start, end: addMinutes(start, service.duration) };
    if (toMinutes(interval.start) < toMinutes(hours.open) || toMinutes(interval.end) > toMinutes(hours.close)) {
      return false;
    }

    const recurring = await db.recurringBooking.findMany({
      where: { active: true, weekday },
      include: { service: true }
    });
    const hasRecurringConflict = recurring
      .filter((item) => item.id !== ignoreRecurringId)
      .some((item) => overlaps(interval, {
        start: item.start,
        end: addMinutes(item.start, item.service.duration)
      }));
    if (hasRecurringConflict) {
      return false;
    }

    const sampleDates = this.nextDatesForWeekday(weekday, 12);
    for (const date of sampleDates) {
      if (await this.isClosedDate(db, date)) {
        continue;
      }

      if (!await this.canUseSlot(db, date, start, service, undefined, ignoreRecurringId)) {
        return false;
      }
    }

    return true;
  }

  private async getBookingsForDate(db: Db, date: string) {
    const regular = await db.appointment.findMany({
      where: { date: toDbDate(date) },
      orderBy: { start: "asc" }
    });
    const recurring = await db.recurringBooking.findMany({
      where: { active: true, weekday: weekdayOf(date) },
      include: { client: true, service: true },
      orderBy: { start: "asc" }
    });

    const generated = recurring.map((item) => ({
      id: `${item.id}-${date}`,
      date,
      start: item.start,
      end: addMinutes(item.start, item.service.duration),
      clientId: item.clientId,
      clientName: item.client.name,
      serviceId: item.serviceId,
      source: AppointmentSource.recurring
    }));

    return [...regular.map(mapAppointment), ...generated].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }

  private async getBusyIntervals(db: Db, date: string, ignoreAppointmentId?: string, ignoreRecurringId?: string): Promise<Interval[]> {
    const bookings = await this.getBookingsForDate(db, date);
    const blocks = await db.manualBlock.findMany({ where: { date: toDbDate(date) } });

    return [
      ...bookings
        .filter((appointment) => appointment.id !== ignoreAppointmentId && appointment.id !== `${ignoreRecurringId}-${date}`)
        .map((appointment) => ({ start: appointment.start, end: appointment.end })),
      ...blocks.map((block) => ({ start: block.start, end: block.end }))
    ];
  }

  private async getAppointment(db: Db, id: string) {
    const appointment = await db.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new NotFoundException("Agendamento nao encontrado.");
    }
    return appointment;
  }

  private async getService(db: Db, id: string) {
    const service = await db.service.findFirst({ where: { id, active: true } });
    if (!service) {
      throw new NotFoundException("Servico nao encontrado ou inativo.");
    }
    return {
      id: service.id,
      duration: service.duration
    };
  }

  private async getBusinessHours(db: Db, weekday: number) {
    const hours = await db.businessHour.findUnique({ where: { weekday } });
    if (!hours) {
      return this.defaultBusinessHours(weekday);
    }
    return hours.open && hours.close ? { open: hours.open, close: hours.close } : null;
  }

  private async isClosedDate(db: Db, date: string) {
    const item = await db.closedDate.findUnique({ where: { date: toDbDate(date) } });
    return Boolean(item);
  }

  private defaultBusinessHours(weekday: number) {
    if (weekday === 0) {
      return null;
    }

    return weekday === 6
      ? { open: "09:00", close: "17:00" }
      : { open: "09:00", close: "19:00" };
  }

  private nextDatesForWeekday(weekday: number, count: number) {
    const today = new Date();
    const diff = (weekday - today.getDay() + 7) % 7;
    const first = new Date(today);
    first.setDate(today.getDate() + diff);

    return Array.from({ length: count }, (_, index) => {
      const candidate = new Date(first);
      candidate.setDate(first.getDate() + index * 7);
      return candidate.toISOString().slice(0, 10);
    });
  }

  private async lockScheduleDate(db: Prisma.TransactionClient, date: string) {
    await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`schedule:${date}`}))`;
  }

  private async lockRecurringWeekday(db: Prisma.TransactionClient, weekday: number) {
    await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`recurring:${weekday}`}))`;
  }
}
