import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { DeletedResponseDto, GalleryItemResponseDto } from "../../openapi/api-response.models";
import { Public } from "../../security/public.decorator";
import { Roles } from "../../security/roles.decorator";
import { CreateGalleryItemDto } from "./dto/create-gallery-item.dto";
import { UpdateGalleryItemDto } from "./dto/update-gallery-item.dto";
import { GalleryService } from "./gallery.service";

@ApiTags("gallery")
@Controller("gallery")
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Public()
  @Get()
  @ApiOkResponse({ type: [GalleryItemResponseDto] })
  findAll() {
    return this.galleryService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: GalleryItemResponseDto })
  create(@Body() dto: CreateGalleryItemDto) {
    return this.galleryService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: GalleryItemResponseDto })
  update(@Param("id") id: string, @Body() dto: UpdateGalleryItemDto) {
    return this.galleryService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(":id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: DeletedResponseDto })
  remove(@Param("id") id: string) {
    return this.galleryService.remove(id);
  }
}

