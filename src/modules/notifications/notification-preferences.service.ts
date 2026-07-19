import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../storage/prisma.service";
import { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";

export const defaultNotificationPreferences = {
  reminders: true,
  appointmentChanges: true,
  promotions: false,
};

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    return preference ?? { userId, ...defaultNotificationPreferences };
  }

  update(userId: string, dto: UpdateNotificationPreferencesDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...defaultNotificationPreferences, ...dto },
      update: dto,
    });
  }
}
