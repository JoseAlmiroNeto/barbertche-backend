import { Module } from "@nestjs/common";
import { StorageModule } from "../../storage/storage.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";

@Module({
  imports: [StorageModule, NotificationsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
