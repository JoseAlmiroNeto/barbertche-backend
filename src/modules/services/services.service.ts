import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { mapService } from "../../storage/prisma-mappers";
import { PrismaService } from "../../storage/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const services = await this.prisma.service.findMany({ orderBy: { name: "asc" } });
    return services.map(mapService);
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException("Servico nao encontrado.");
    }
    return mapService(service);
  }

  async create(dto: CreateServiceDto) {
    const service = await this.prisma.service.create({
      data: {
        name: dto.name,
        duration: dto.duration,
        price: dto.price,
        active: dto.active ?? true,
      },
    });
    return mapService(service);
  }

  async update(id: string, dto: UpdateServiceDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("Informe ao menos um campo para atualizar.");
    }
    await this.findOne(id);
    const service = await this.prisma.service.update({ where: { id }, data: dto });
    return mapService(service);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
  }
}
