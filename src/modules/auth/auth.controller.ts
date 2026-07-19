import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AuthMeResponseDto, AuthResponseDto, PushTokenResponseDto } from "../../openapi/api-response.models";
import { CurrentUser } from "../../security/current-user.decorator";
import { Public } from "../../security/public.decorator";
import type { AuthenticatedUser } from "../../security/auth.types";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { PushTokenDto } from "./dto/push-token.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { RemovePushTokenDto } from "./dto/remove-push-token.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() @UseGuards(ThrottlerGuard) @Throttle({ default: { limit: 5, ttl: 60_000 } }) @Post("register")
  @ApiCreatedResponse({ type: AuthResponseDto })
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @Public() @UseGuards(ThrottlerGuard) @Throttle({ default: { limit: 5, ttl: 60_000 } }) @Post("login")
  @ApiCreatedResponse({ type: AuthResponseDto })
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @Public() @UseGuards(ThrottlerGuard) @Throttle({ default: { limit: 20, ttl: 60_000 } }) @Post("refresh")
  @ApiCreatedResponse({ type: AuthResponseDto })
  refresh(@Body() dto: RefreshTokenDto) { return this.authService.refresh(dto.refreshToken); }

  @Get("me") @ApiBearerAuth() @ApiOkResponse({ type: AuthMeResponseDto })
  me(@CurrentUser() user: AuthenticatedUser) { return this.authService.me(user.id); }

  @Post("logout") @HttpCode(HttpStatus.NO_CONTENT) @ApiBearerAuth() @ApiNoContentResponse()
  async logout(@CurrentUser() user: AuthenticatedUser) { await this.authService.logout(user.sessionId); }

  @Post("push-token") @ApiBearerAuth() @ApiCreatedResponse({ type: PushTokenResponseDto })
  savePushToken(@CurrentUser() user: AuthenticatedUser, @Body() dto: PushTokenDto) {
    return this.authService.savePushToken(user.id, user.sessionId, dto);
  }

  @Delete("push-token") @HttpCode(HttpStatus.NO_CONTENT) @ApiBearerAuth() @ApiNoContentResponse()
  async removePushToken(@CurrentUser() user: AuthenticatedUser, @Body() dto: RemovePushTokenDto) {
    await this.authService.removePushToken(user.id, dto.token);
  }
}
