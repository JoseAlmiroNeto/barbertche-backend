import { IsISO8601, IsMilitaryTime } from "class-validator";

export class RescheduleAppointmentDto {
  @IsISO8601({ strict: true })
  date!: string;

  @IsMilitaryTime()
  start!: string;
}
