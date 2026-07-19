import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { NotificationPreferencesResponseDto, PromotionQueuedResponseDto } from "../../openapi/api-response.models";
import { CurrentUser } from "../../security/current-user.decorator";
import { Roles } from "../../security/roles.decorator";
import type { AuthenticatedUser } from "../../security/auth.types";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";
import { NotificationPreferencesService } from "./notification-preferences.service";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly preferences: NotificationPreferencesService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get("preferences") @ApiOkResponse({ type: NotificationPreferencesResponseDto })
  getPreferences(@CurrentUser() user: AuthenticatedUser) { return this.preferences.get(user.id); }

  @Patch("preferences") @ApiOkResponse({ type: NotificationPreferencesResponseDto })
  updatePreferences(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateNotificationPreferencesDto) { return this.preferences.update(user.id, dto); }

  @Roles(UserRole.ADMIN)
  @Post("promotions") @ApiCreatedResponse({ type: PromotionQueuedResponseDto })
  createPromotion(@Body() dto: CreatePromotionDto) { return this.notifications.createPromotion(dto); }
}
