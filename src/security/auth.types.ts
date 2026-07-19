import { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  clientId: string | null;
  sessionId: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  sid: string;
  type: "access";
};

export type RefreshJwtPayload = {
  sub: string;
  sid: string;
  type: "refresh";
};
