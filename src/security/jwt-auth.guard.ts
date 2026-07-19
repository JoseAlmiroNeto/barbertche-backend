import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { isPublicKey } from "./public.decorator";
import type { AuthenticatedUser, JwtPayload } from "./auth.types";
import { PrismaService } from "../storage/prisma.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(isPublicKey, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthenticatedUser;
    }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      throw new UnauthorizedException("Sessao expirada. Entre novamente.");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (payload.type !== "access" || !payload.sid) {
        throw new UnauthorizedException("Token invalido.");
      }
      const [user, session] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: payload.sub } }),
        this.prisma.authSession.findUnique({ where: { id: payload.sid } }),
      ]);

      if (!user || !user.active || !session || session.userId !== user.id || session.revokedAt || session.expiresAt <= new Date()) {
        throw new UnauthorizedException("Usuario inativo ou nao encontrado.");
      }

      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
        sessionId: session.id,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Sessao expirada. Entre novamente.");
    }
  }
}
