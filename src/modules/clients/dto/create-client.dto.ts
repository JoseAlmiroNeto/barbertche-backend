import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string;
}
