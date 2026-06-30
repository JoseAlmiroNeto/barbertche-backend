import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadsService, type UploadedImageFile } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("image")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(
    @UploadedFile() file: UploadedImageFile | undefined,
    @Body("folder") folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException("Selecione uma imagem para enviar.");
    }

    return this.uploadsService.uploadImage(file, folder);
  }
}
