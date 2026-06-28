import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../storage/prisma.service";
import { CreateClientDto } from "./dto/create-client.dto";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.findMany({ orderBy: { name: "asc" } });
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async remove(id: string) {
    const exists = await this.prisma.client.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException("Cliente nao encontrado.");
    }

    await this.prisma.client.delete({ where: { id } });
    return { deleted: true };
  }
}
