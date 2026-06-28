import { IsBoolean, IsInt, IsMilitaryTime, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateRecurringBookingDto {
  @IsString()
  clientId!: string;

  @IsString()
  serviceId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @IsMilitaryTime()
  start!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
