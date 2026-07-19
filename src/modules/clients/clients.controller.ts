import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { ClientResponseDto, DeletedResponseDto } from "../../openapi/api-response.models";
import { Roles } from "../../security/roles.decorator";
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@Roles(UserRole.ADMIN)
@ApiTags("clients")
@ApiBearerAuth()
@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOkResponse({ type: [ClientResponseDto] })
  findAll() {
    return this.clientsService.findAll();
  }

  @Post()
  @ApiCreatedResponse({ type: ClientResponseDto })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Patch(":id")
  @ApiOkResponse({ type: ClientResponseDto })
  update(@Param("id") id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOkResponse({ type: DeletedResponseDto })
  remove(@Param("id") id: string) {
    return this.clientsService.remove(id);
  }
}
