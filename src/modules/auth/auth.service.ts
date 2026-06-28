import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserRole } from "@prisma/client";
import { hashPassword, verifyPassword } from "../../security/password";
import { signToken } from "../../security/token";
import { PrismaService } from "../../storage/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException("As senhas nao conferem.");
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException("Ja existe um usuario com esse e-mail.");
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          name: dto.name.trim(),
          phone: dto.phone.trim()
        }
      });

      return tx.user.create({
        data: {
          name: dto.name.trim(),
          email,
          phone: dto.phone.trim(),
          passwordHash: hashPassword(dto.password),
          role: UserRole.CLIENT,
          clientId: client.id,
          active: true
        } as never
      });
    });

    const createdUser = user as typeof user & { clientId: string };
    return this.buildAuthResponse(user, {
      id: createdUser.clientId,
      name: user.name,
      phone: user.phone ?? dto.phone.trim()
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() }
    });

    if (!user || !user.active || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("E-mail ou senha invalidos.");
    }

    const userWithClientId = user as typeof user & { clientId?: string | null };
    const client = userWithClientId.clientId
      ? await this.prisma.client.findUnique({ where: { id: userWithClientId.clientId } })
      : null;

    return this.buildAuthResponse(user, client);
  }

  private buildAuthResponse(user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
  }, client: { id: string; name: string; phone: string } | null) {
    const secret = this.config.get<string>("JWT_SECRET") ?? "dev-secret-change-me";
    return {
      token: signToken({ sub: user.id, role: user.role, email: user.email }, secret),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        client
      }
    };
  }
}
