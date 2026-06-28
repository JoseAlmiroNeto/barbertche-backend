import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateGalleryItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  image!: string;
}
