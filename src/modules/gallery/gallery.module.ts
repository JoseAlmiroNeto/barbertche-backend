import { Module } from "@nestjs/common";
import { StorageModule } from "../../storage/storage.module";
import { UploadsModule } from "../uploads/uploads.module";
import { GalleryController } from "./gallery.controller";
import { GalleryService } from "./gallery.service";

@Module({
  imports: [StorageModule, UploadsModule],
  controllers: [GalleryController],
  providers: [GalleryService]
})
export class GalleryModule {}

