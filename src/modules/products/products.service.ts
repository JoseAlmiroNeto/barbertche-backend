import { Injectable, NotFoundException } from "@nestjs/common";
import { mapProduct } from "../../storage/prisma-mappers";
import { PrismaService } from "../../storage/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

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
        available: dto.available ?? true
      }
    });
    return mapProduct(product);
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException("Produto nao encontrado.");
    }

    const updated = await this.prisma.product.update({ where: { id }, data: dto });
    return mapProduct(updated);
  }

  async remove(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException("Produto nao encontrado.");
    }

    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }
}
