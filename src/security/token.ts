import { createHmac } from "node:crypto";

type TokenPayload = {
  sub: string;
  role: string;
  email: string;
  exp: number;
};

export function signToken(payload: Omit<TokenPayload, "exp">, secret: string, expiresInSeconds = 60 * 60 * 24 * 7) {
  const body: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };
  const encodedPayload = base64Url(JSON.stringify(body));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string, secret: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || sign(encodedPayload, secret) !== signature) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as TokenPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}
