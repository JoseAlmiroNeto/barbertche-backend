import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../storage/prisma.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.findMany({ orderBy: { name: "asc" } });
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("Informe ao menos um campo para atualizar.");
    }

    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const client = await tx.client.update({ where: { id }, data: dto });
      await tx.user.updateMany({
        where: { clientId: id },
        data: { name: dto.name, phone: dto.phone },
      });
      return client;
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.client.findUnique({
      where: { id },
      include: { user: { select: { id: true } } },
    });
    if (!exists) {
      throw new NotFoundException("Cliente nao encontrado.");
    }
    if (exists.user) {
      throw new ConflictException(
        "Cliente com acesso ao app nao pode ser excluido. Edite os dados cadastrais.",
      );
    }

    await this.prisma.client.delete({ where: { id } });
    return { deleted: true };
  }

  private async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException("Cliente nao encontrado.");
    }
    return client;
  }
}
