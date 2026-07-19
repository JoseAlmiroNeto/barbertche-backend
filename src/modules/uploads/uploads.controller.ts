import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { UploadResponseDto } from "../../openapi/api-response.models";
import { Roles } from "../../security/roles.decorator";
import { UploadsService, type UploadedImageFile } from "./uploads.service";

@Roles(UserRole.ADMIN)
@ApiTags("uploads")
@ApiBearerAuth()
@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("image")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        file: { type: "string", format: "binary" },
        folder: { type: "string" },
      },
    },
  })
  @ApiCreatedResponse({ type: UploadResponseDto })
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
