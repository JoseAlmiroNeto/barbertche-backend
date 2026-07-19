import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() reminders?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() appointmentChanges?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() promotions?: boolean;
}
