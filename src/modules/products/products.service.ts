import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { mapProduct } from "../../storage/prisma-mappers";
import { PrismaService } from "../../storage/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll() {
    const products = await this.prisma.product.findMany({ orderBy: { name: "asc" } });
    return products.map(mapProduct);
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        image: dto.image,
        description: dto.description,
        available: dto.available ?? true,
      },
    });
    return mapProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("Informe ao menos um campo para atualizar.");
    }
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException("Produto nao encontrado.");
    }

    const updated = await this.prisma.product.update({ where: { id }, data: dto });

    if (dto.image && dto.image !== product.image) {
      await this.uploadsService.removePublicImage(product.image);
    }

    return mapProduct(updated);
  }

  async remove(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException("Produto nao encontrado.");
    }

    await this.uploadsService.removePublicImage(exists.image);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }
}
