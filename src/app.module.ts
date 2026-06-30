import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { GalleryModule } from "./modules/gallery/gallery.module";
import { ProductsModule } from "./modules/products/products.module";
import { ServicesModule } from "./modules/services/services.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { StorageModule } from "./storage/storage.module";
import { JwtAuthGuard } from "./security/jwt-auth.guard";
import { RolesGuard } from "./security/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    StorageModule,
    AuthModule,
    ClientsModule,
    ServicesModule,
    AppointmentsModule,
    SettingsModule,
    ProductsModule,
    GalleryModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

