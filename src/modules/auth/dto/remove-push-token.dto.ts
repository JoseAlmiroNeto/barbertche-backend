import { IsString, MaxLength } from "class-validator";

export class RemovePushTokenDto {
  @IsString()
  @MaxLength(512)
  token!: string;
}
