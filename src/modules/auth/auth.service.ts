import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import type { RefreshJwtPayload } from "../../security/auth.types";
import { hashPassword, verifyPassword } from "../../security/password";
import { PrismaService } from "../../storage/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { PushTokenDto } from "./dto/push-token.dto";
import { RegisterDto } from "./dto/register.dto";

const currentTermsVersion = "2026-06-30";
const currentPrivacyVersion = "2026-06-30";
const refreshTokenLifetimeMs = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException("As senhas nao conferem.");
    }
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new BadRequestException("Ja existe um usuario com esse e-mail.");
    }
    const user = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({ data: { name: dto.name.trim(), phone: dto.phone.trim() } });
      return tx.user.create({
        data: {
          name: dto.name.trim(), email, phone: dto.phone.trim(), passwordHash: hashPassword(dto.password),
          role: UserRole.CLIENT, clientId: client.id, active: true, termsAcceptedAt: new Date(),
          termsVersion: currentTermsVersion, privacyVersion: currentPrivacyVersion,
        },
        include: { client: true },
      });
    });
    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() }, include: { client: true },
    });
    if (!user || !user.active || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("E-mail ou senha invalidos.");
    }
    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException("Refresh token invalido ou expirado.");
    }
    if (payload.type !== "refresh" || !payload.sid) {
      throw new UnauthorizedException("Refresh token invalido.");
    }
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid }, include: { user: { include: { client: true } } },
    });
    const presentedHash = this.hashToken(refreshToken);
    if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date() || !session.user.active) {
      throw new UnauthorizedException("Sessao revogada ou expirada.");
    }
    if (!this.hashesMatch(session.refreshTokenHash, presentedHash)) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException("Refresh token reutilizado. Sessao revogada.");
    }
    const nextRefreshToken = await this.signRefreshToken(session.userId, session.id);
    const updated = await this.prisma.authSession.updateMany({
      where: { id: session.id, refreshTokenHash: presentedHash, revokedAt: null },
      data: { refreshTokenHash: this.hashToken(nextRefreshToken) },
    });
    if (updated.count !== 1) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException("Refresh token reutilizado. Sessao revogada.");
    }
    return this.buildAuthResponse(session.user, session.id, nextRefreshToken);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user || !user.active) throw new UnauthorizedException("Usuario inativo ou nao encontrado.");
    return { user: this.publicUser(user) };
  }

  async logout(sessionId: string) {
    await this.revokeSession(sessionId);
  }

  async savePushToken(userId: string, sessionId: string, dto: PushTokenDto) {
    return this.prisma.pushToken.upsert({
      where: { token: dto.token },
      create: { token: dto.token, platform: dto.platform, deviceId: dto.deviceId, userId, sessionId },
      update: { platform: dto.platform, deviceId: dto.deviceId, userId, sessionId },
      select: { id: true, platform: true, deviceId: true, updatedAt: true },
    });
  }

  async removePushToken(userId: string, token: string) {
    await this.prisma.pushToken.deleteMany({ where: { userId, token } });
  }

  private async createSession(user: Parameters<AuthService["publicUser"]>[0]) {
    const session = await this.prisma.authSession.create({
      data: { userId: user.id, refreshTokenHash: randomUUID(), expiresAt: new Date(Date.now() + refreshTokenLifetimeMs) },
    });
    const refreshToken = await this.signRefreshToken(user.id, session.id);
    await this.prisma.authSession.update({ where: { id: session.id }, data: { refreshTokenHash: this.hashToken(refreshToken) } });
    return this.buildAuthResponse(user, session.id, refreshToken);
  }

  private buildAuthResponse(user: Parameters<AuthService["publicUser"]>[0], sessionId: string, refreshToken: string) {
    return {
      accessToken: this.jwtService.sign({ sub: user.id, sid: sessionId, type: "access", role: user.role, email: user.email }),
      refreshToken,
      user: this.publicUser(user),
    };
  }

  private publicUser(user: { id: string; name: string; email: string; phone: string | null; role: UserRole; client: { id: string; name: string; phone: string } | null }) {
    return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, client: user.client };
  }

  private signRefreshToken(userId: string, sessionId: string) {
    return this.jwtService.signAsync({ sub: userId, sid: sessionId, type: "refresh", jti: randomUUID() }, { expiresIn: "30d" });
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private hashesMatch(stored: string, presented: string) {
    const left = Buffer.from(stored);
    const right = Buffer.from(presented);
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private async revokeSession(sessionId: string) {
    await this.prisma.$transaction([
      this.prisma.authSession.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.pushToken.deleteMany({ where: { sessionId } }),
    ]);
  }
}
