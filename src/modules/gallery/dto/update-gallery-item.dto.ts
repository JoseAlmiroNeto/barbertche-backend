import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateGalleryItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  image?: string;
}
