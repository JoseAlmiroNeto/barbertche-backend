import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiBearerAuth, ApiCreatedResponse, ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from "@nestjs/swagger";
import {
  BusinessHourResponseDto,
  ClosedDateResponseDto,
  DeletedResponseDto,
  ManualBlockResponseDto,
  SettingsResponseDto,
} from "../../openapi/api-response.models";
import { Public } from "../../security/public.decorator";
import { Roles } from "../../security/roles.decorator";
import { CreateBlockDto } from "./dto/create-block.dto";
import { CreateClosedDateDto } from "./dto/create-closed-date.dto";
import { UpdateBusinessHourDto } from "./dto/update-business-hour.dto";
import { SettingsService } from "./settings.service";

@ApiTags("settings")
@ApiExtraModels(BusinessHourResponseDto)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get()
  @ApiOkResponse({ type: SettingsResponseDto })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Roles(UserRole.ADMIN)
  @Patch("business-hours")
  @ApiBearerAuth()
  @ApiOkResponse({
    schema: {
      type: "object",
      additionalProperties: {
        allOf: [{ $ref: getSchemaPath(BusinessHourResponseDto) }],
        nullable: true,
      },
    },
  })
  updateBusinessHour(@Body() dto: UpdateBusinessHourDto) {
    return this.settingsService.updateBusinessHour(dto);
  }

  @Roles(UserRole.ADMIN)
  @Post("closed-dates")
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: [ClosedDateResponseDto] })
  addClosedDate(@Body() dto: CreateClosedDateDto) {
    return this.settingsService.addClosedDate(dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete("closed-dates/:date")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [ClosedDateResponseDto] })
  removeClosedDate(@Param("date") date: string) {
    return this.settingsService.removeClosedDate(date);
  }

  @Roles(UserRole.ADMIN)
  @Post("blocks")
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ManualBlockResponseDto })
  addBlock(@Body() dto: CreateBlockDto) {
    return this.settingsService.addBlock(dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete("blocks/:id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: DeletedResponseDto })
  removeBlock(@Param("id") id: string) {
    return this.settingsService.removeBlock(id);
  }
}

