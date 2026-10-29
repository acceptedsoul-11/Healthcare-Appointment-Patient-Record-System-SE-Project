
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "healthcare_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getSessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: {
  id: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionKey());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSessionKey(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME, SESSION_DURATION_SECONDS };
