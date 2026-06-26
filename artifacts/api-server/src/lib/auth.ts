import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "bluestar-default-secret";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", SECRET).update(password + salt).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const candidate = createHmac("sha256", SECRET).update(password + salt).digest("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

export function createToken(userId: number, role: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, role, iat: Date.now() })).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const [payload, sig] = token.split(".");
    const expectedSig = createHmac("sha256", SECRET).update(payload).digest("base64url");
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}
