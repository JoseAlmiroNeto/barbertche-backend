import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CreateServiceDto } from "./dto/create-service.dto";
import { ServicesService } from "./services.service";

@Controller("services")
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: Partial<CreateServiceDto>) {
    return this.servicesService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.servicesService.remove(id);
  }
}
