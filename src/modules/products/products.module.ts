import { Module } from "@nestjs/common";
import { StorageModule } from "../../storage/storage.module";
import { UploadsModule } from "../uploads/uploads.module";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [StorageModule, UploadsModule],
  controllers: [ProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}

