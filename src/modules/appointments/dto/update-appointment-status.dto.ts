import { AppointmentStatus } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus, enumName: "AppointmentStatus" })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cancellationReason?: string;
}
