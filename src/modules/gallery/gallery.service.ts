import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { mapGalleryItem } from "../../storage/prisma-mappers";
import { PrismaService } from "../../storage/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { CreateGalleryItemDto } from "./dto/create-gallery-item.dto";
import { UpdateGalleryItemDto } from "./dto/update-gallery-item.dto";

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll() {
    const items = await this.prisma.galleryItem.findMany({ orderBy: { createdAt: "desc" } });
    return items.map(mapGalleryItem);
  }

  async create(dto: CreateGalleryItemDto) {
    const item = await this.prisma.galleryItem.create({ data: dto });
    return mapGalleryItem(item);
  }

  async update(id: string, dto: UpdateGalleryItemDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("Informe ao menos um campo para atualizar.");
    }
    const item = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException("Imagem nao encontrada.");
    }

    const updated = await this.prisma.galleryItem.update({ where: { id }, data: dto });

    if (dto.image && dto.image !== item.image) {
      await this.uploadsService.removePublicImage(item.image);
    }

    return mapGalleryItem(updated);
  }

  async remove(id: string) {
    const exists = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException("Imagem nao encontrada.");
    }

    await this.uploadsService.removePublicImage(exists.image);
    await this.prisma.galleryItem.delete({ where: { id } });
    return { deleted: true };
  }
}
