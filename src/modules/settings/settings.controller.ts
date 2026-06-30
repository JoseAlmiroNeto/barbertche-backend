import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Public } from "../../security/public.decorator";
import { Roles } from "../../security/roles.decorator";
import { CreateBlockDto } from "./dto/create-block.dto";
import { CreateClosedDateDto } from "./dto/create-closed-date.dto";
import { UpdateBusinessHourDto } from "./dto/update-business-hour.dto";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Roles(UserRole.ADMIN)
  @Patch("business-hours")
  updateBusinessHour(@Body() dto: UpdateBusinessHourDto) {
    return this.settingsService.updateBusinessHour(dto);
  }

  @Roles(UserRole.ADMIN)
  @Post("closed-dates")
  addClosedDate(@Body() dto: CreateClosedDateDto) {
    return this.settingsService.addClosedDate(dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete("closed-dates/:date")
  removeClosedDate(@Param("date") date: string) {
    return this.settingsService.removeClosedDate(date);
  }

  @Roles(UserRole.ADMIN)
  @Post("blocks")
  addBlock(@Body() dto: CreateBlockDto) {
    return this.settingsService.addBlock(dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete("blocks/:id")
  removeBlock(@Param("id") id: string) {
    return this.settingsService.removeBlock(id);
  }
}

