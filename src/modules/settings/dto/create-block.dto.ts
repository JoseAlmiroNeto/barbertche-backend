import { IsISO8601, IsMilitaryTime, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateBlockDto {
  @IsISO8601({ strict: true })
  date!: string;

  @IsMilitaryTime()
  start!: string;

  @IsMilitaryTime()
  end!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  reason!: string;
}
