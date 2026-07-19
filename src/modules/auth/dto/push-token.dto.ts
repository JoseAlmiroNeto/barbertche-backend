import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class PushTokenDto {
  @IsString()
  @MaxLength(512)
  token!: string;

  @IsIn(["android", "ios"])
  platform!: "android" | "ios";

  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceId?: string;
}
