import { Module } from "@nestjs/common";
import { StorageModule } from "../../storage/storage.module";
import { AppointmentRemindersService } from "./appointment-reminders.service";
import { ExpoPushClient } from "./expo-push.client";
import { NotificationPreferencesService } from "./notification-preferences.service";
import { NotificationQueueService } from "./notification-queue.service";
import { NotificationWorker } from "./notification.worker";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [StorageModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationPreferencesService, NotificationQueueService, ExpoPushClient, NotificationWorker, AppointmentRemindersService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
