import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { toMinutes } from "../../domain/time";
import { mapBusinessHours, mapClosedDate, mapManualBlock, toDbDate } from "../../storage/prisma-mappers";
import { PrismaService } from "../../storage/prisma.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import { CreateClosedDateDto } from "./dto/create-closed-date.dto";
import { UpdateBusinessHourDto } from "./dto/update-business-hour.dto";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    await this.ensureBusinessHours();
    const [businessHours, closedDates, blocks] = await Promise.all([
      this.prisma.businessHour.findMany({ orderBy: { weekday: "asc" } }),
      this.prisma.closedDate.findMany({ orderBy: { date: "asc" } }),
      this.prisma.manualBlock.findMany({ orderBy: [{ date: "asc" }, { start: "asc" }] })
    ]);

    return {
      businessHours: mapBusinessHours(businessHours),
      closedDates: closedDates.map(mapClosedDate),
      blocks: blocks.map(mapManualBlock)
    };
  }

  async updateBusinessHour(dto: UpdateBusinessHourDto) {
    if (!dto.open || !dto.close) {
      await this.prisma.businessHour.upsert({
        where: { weekday: dto.weekday },
        create: { weekday: dto.weekday, open: null, close: null },
        update: { open: null, close: null }
      });
      return this.getBusinessHours();
    }

    if (toMinutes(dto.open) >= toMinutes(dto.close)) {
      throw new BadRequestException("Horario de abertura deve ser antes do fechamento.");
    }

    await this.prisma.businessHour.upsert({
      where: { weekday: dto.weekday },
      create: { weekday: dto.weekday, open: dto.open, close: dto.close },
      update: { open: dto.open, close: dto.close }
    });
    return this.getBusinessHours();
  }

  async addClosedDate(dto: CreateClosedDateDto) {
    await this.prisma.closedDate.upsert({
      where: { date: toDbDate(dto.date) },
      create: { date: toDbDate(dto.date), reason: dto.reason },
      update: { reason: dto.reason }
    });
    return this.getClosedDates();
  }

  async removeClosedDate(date: string) {
    await this.prisma.closedDate.deleteMany({ where: { date: toDbDate(date) } });
    return this.getClosedDates();
  }

  async addBlock(dto: CreateBlockDto) {
    if (toMinutes(dto.start) >= toMinutes(dto.end)) {
      throw new BadRequestException("Inicio do bloqueio deve ser antes do fim.");
    }

    const block = await this.prisma.manualBlock.create({
      data: {
        date: toDbDate(dto.date),
        start: dto.start,
        end: dto.end,
        reason: dto.reason
      }
    });
    return mapManualBlock(block);
  }

  async removeBlock(id: string) {
    const exists = await this.prisma.manualBlock.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException("Bloqueio nao encontrado.");
    }

    await this.prisma.manualBlock.delete({ where: { id } });
    return { deleted: true };
  }

  private async getBusinessHours() {
    await this.ensureBusinessHours();
    const items = await this.prisma.businessHour.findMany({ orderBy: { weekday: "asc" } });
    return mapBusinessHours(items);
  }

  private async getClosedDates() {
    const items = await this.prisma.closedDate.findMany({ orderBy: { date: "asc" } });
    return items.map(mapClosedDate);
  }

  private async ensureBusinessHours() {
    const count = await this.prisma.businessHour.count();
    if (count > 0) {
      return;
    }

    await this.prisma.businessHour.createMany({
      data: [
        { weekday: 0, open: null, close: null },
        { weekday: 1, open: "09:00", close: "19:00" },
        { weekday: 2, open: "09:00", close: "19:00" },
        { weekday: 3, open: "09:00", close: "19:00" },
        { weekday: 4, open: "09:00", close: "19:00" },
        { weekday: 5, open: "09:00", close: "19:00" },
        { weekday: 6, open: "09:00", close: "17:00" }
      ]
    });
  }
}
