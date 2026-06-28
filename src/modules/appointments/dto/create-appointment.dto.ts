import { IsIn, IsISO8601, IsMilitaryTime, IsOptional, IsString } from "class-validator";

export class CreateAppointmentDto {
  @IsISO8601({ strict: true })
  date!: string;

  @IsMilitaryTime()
  start!: string;

  @IsString()
  serviceId!: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsIn(["app", "manual"])
  source?: "app" | "manual";
}
