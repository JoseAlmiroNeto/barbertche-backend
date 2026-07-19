import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone?: string;
}
