import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { DeletedResponseDto, ServiceResponseDto } from "../../openapi/api-response.models";
import { Public } from "../../security/public.decorator";
import { Roles } from "../../security/roles.decorator";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServicesService } from "./services.service";

@ApiTags("services")
@Controller("services")
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  @ApiOkResponse({ type: [ServiceResponseDto] })
  findAll() {
    return this.servicesService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ServiceResponseDto })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: ServiceResponseDto })
  update(@Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(":id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: DeletedResponseDto })
  remove(@Param("id") id: string) {
    return this.servicesService.remove(id);
  }
}

