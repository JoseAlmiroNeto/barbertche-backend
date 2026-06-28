import { IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateClosedDateDto {
  @IsISO8601({ strict: true })
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  reason?: string;
}
