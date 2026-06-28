import { IsInt, IsMilitaryTime, IsOptional, Max, Min } from "class-validator";

export class UpdateBusinessHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @IsOptional()
  @IsMilitaryTime()
  open?: string;

  @IsOptional()
  @IsMilitaryTime()
  close?: string;
}
