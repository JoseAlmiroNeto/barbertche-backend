import { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  clientId: string | null;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
