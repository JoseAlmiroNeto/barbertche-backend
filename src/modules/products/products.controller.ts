import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { DeletedResponseDto, ProductResponseDto } from "../../openapi/api-response.models";
import { Public } from "../../security/public.decorator";
import { Roles } from "../../security/roles.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOkResponse({ type: [ProductResponseDto] })
  findAll() {
    return this.productsService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: ProductResponseDto })
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(":id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: DeletedResponseDto })
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}

