import { Secret, TOTP } from "otpauth";

const ISSUER = "Club Cannábico App";

export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export function totpUri(secret: string, email: string): string {
  return new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  }).toString();
}

export function verifyTotp(secret: string, token: string): boolean {
  const code = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(code)) return false;
  const totp = new TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}
