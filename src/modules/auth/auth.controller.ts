import { Body, Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { CurrentUser } from "../../security/current-user.decorator";
import { Public } from "../../security/public.decorator";
import type { AuthenticatedUser } from "../../security/auth.types";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
  me(
    @CurrentUser() user: AuthenticatedUser,
    @Headers("authorization") authorization?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, "").trim();
    return this.authService.me(user.id, token);
  }
}
