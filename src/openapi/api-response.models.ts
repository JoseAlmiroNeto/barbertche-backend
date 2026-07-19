import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ClientResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() phone!: string;
}

export class ServiceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() duration!: number;
  @ApiProperty() price!: number;
  @ApiProperty() active!: boolean;
}

export class AppointmentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ format: "date" }) date!: string;
  @ApiProperty({ example: "09:00" }) start!: string;
  @ApiProperty({ example: "09:30" }) end!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) clientId?: string | null;
  @ApiProperty() clientName!: string;
  @ApiProperty() serviceId!: string;
  @ApiProperty({ enum: ["app", "manual", "recurring"] }) source!: "app" | "manual" | "recurring";
  @ApiProperty({ enum: ["SCHEDULED", "COMPLETED", "CANCELED", "NO_SHOW"] })
  status!: "SCHEDULED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
  @ApiPropertyOptional({ type: String, format: "date-time", nullable: true }) canceledAt?: string | null;
  @ApiPropertyOptional({ type: String, format: "date-time", nullable: true }) completedAt?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) cancellationReason?: string | null;
}

export class RecurringBookingResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() clientId!: string;
  @ApiProperty() serviceId!: string;
  @ApiProperty({ minimum: 0, maximum: 6 }) weekday!: number;
  @ApiProperty({ example: "09:00" }) start!: string;
  @ApiProperty() active!: boolean;
}

export class ManualBlockResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ format: "date" }) date!: string;
  @ApiProperty({ example: "12:00" }) start!: string;
  @ApiProperty({ example: "13:00" }) end!: string;
  @ApiProperty() reason!: string;
}

export class ClosedDateResponseDto {
  @ApiProperty({ format: "date" }) date!: string;
  @ApiPropertyOptional() reason?: string;
}

export class BusinessHourResponseDto {
  @ApiProperty({ example: "09:00" }) open!: string;
  @ApiProperty({ example: "19:00" }) close!: string;
}

export class SettingsResponseDto {
  @ApiProperty({
    type: "object",
    additionalProperties: {
      allOf: [{ $ref: "#/components/schemas/BusinessHourResponseDto" }],
      nullable: true,
    },
  })
  businessHours!: Record<string, BusinessHourResponseDto | null>;

  @ApiProperty({ type: [ClosedDateResponseDto] }) closedDates!: ClosedDateResponseDto[];
  @ApiProperty({ type: [ManualBlockResponseDto] }) blocks!: ManualBlockResponseDto[];
}

export class ProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() image?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() price!: number;
  @ApiProperty() available!: boolean;
}

export class GalleryItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() image!: string;
}

export class AuthUserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ type: String, nullable: true }) phone!: string | null;
  @ApiProperty({ enum: ["ADMIN", "CLIENT"] }) role!: "ADMIN" | "CLIENT";
  @ApiProperty({ type: ClientResponseDto, nullable: true }) client!: ClientResponseDto | null;
}

export class AuthResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty({ type: AuthUserResponseDto }) user!: AuthUserResponseDto;
}

export class AuthMeResponseDto {
  @ApiProperty({ type: AuthUserResponseDto }) user!: AuthUserResponseDto;
}

export class PushTokenResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ["android", "ios"] }) platform!: "android" | "ios";
  @ApiPropertyOptional({ type: String, nullable: true }) deviceId?: string | null;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
}

export class NotificationPreferencesResponseDto {
  @ApiProperty() userId!: string;
  @ApiProperty() reminders!: boolean;
  @ApiProperty() appointmentChanges!: boolean;
  @ApiProperty() promotions!: boolean;
}

export class PromotionQueuedResponseDto {
  @ApiProperty({ minimum: 0 }) queued!: number;
}

export class MyAppointmentsResponseDto {
  @ApiProperty({ type: [AppointmentResponseDto] }) appointments!: AppointmentResponseDto[];
  @ApiProperty({ type: [RecurringBookingResponseDto] }) recurring!: RecurringBookingResponseDto[];
}

export class DeletedResponseDto {
  @ApiProperty({ example: true }) deleted!: boolean;
}

export class UploadResponseDto {
  @ApiProperty() path!: string;
  @ApiProperty() url!: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: "ok" }) status!: string;
  @ApiProperty({ example: "barbertche-back" }) service!: string;
}
