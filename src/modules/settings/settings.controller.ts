import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CreateBlockDto } from "./dto/create-block.dto";
import { CreateClosedDateDto } from "./dto/create-closed-date.dto";
import { UpdateBusinessHourDto } from "./dto/update-business-hour.dto";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch("business-hours")
  updateBusinessHour(@Body() dto: UpdateBusinessHourDto) {
    return this.settingsService.updateBusinessHour(dto);
  }

  @Post("closed-dates")
  addClosedDate(@Body() dto: CreateClosedDateDto) {
    return this.settingsService.addClosedDate(dto);
  }

  @Delete("closed-dates/:date")
  removeClosedDate(@Param("date") date: string) {
    return this.settingsService.removeClosedDate(date);
  }

  @Post("blocks")
  addBlock(@Body() dto: CreateBlockDto) {
    return this.settingsService.addBlock(dto);
  }

  @Delete("blocks/:id")
  removeBlock(@Param("id") id: string) {
    return this.settingsService.removeBlock(id);
  }
}
