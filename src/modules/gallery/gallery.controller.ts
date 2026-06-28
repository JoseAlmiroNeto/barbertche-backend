import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CreateGalleryItemDto } from "./dto/create-gallery-item.dto";
import { GalleryService } from "./gallery.service";

@Controller("gallery")
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  findAll() {
    return this.galleryService.findAll();
  }

  @Post()
  create(@Body() dto: CreateGalleryItemDto) {
    return this.galleryService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: Partial<CreateGalleryItemDto>) {
    return this.galleryService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.galleryService.remove(id);
  }
}
