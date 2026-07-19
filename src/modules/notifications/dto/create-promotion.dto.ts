import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreatePromotionDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(80) title!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(240) body!: string;
  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional() @IsObject() data?: Record<string, string>;
}
