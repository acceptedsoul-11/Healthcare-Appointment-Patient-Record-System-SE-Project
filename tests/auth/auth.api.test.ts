import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn() } }));
vi.mock("@/models/User", () => ({ default: { findOne: vi.fn() } }));

import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

const userModel = User as unknown as { findOne: ReturnType<typeof vi.fn> };
const comparePassword = bcrypt.compare as unknown as ReturnType<typeof vi.fn>;
const jsonRequest = (url: string, body: unknown) =>
  new NextRequest(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("Authentication API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = "automated-test-secret-only-never-a-real-credential";
  });

  it("creates a signed session cookie for a valid patient login", async () => {
    userModel.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue({
      _id: { toString: () => "64b000000000000000000001" },
      fullName: "Synthetic Patient",
      email: "patient@example.test",
      role: "patient",
      passwordHash: "test-hash",
    }) });
    comparePassword.mockResolvedValue(true);

    const response = await login(jsonRequest("http://localhost/api/auth/login", {
      email: "PATIENT@example.test", password: "SyntheticPass2026",
    }));
    const sessionCookie = response.cookies.get(COOKIE_NAME);

    expect(response.status).toBe(200);
    expect(sessionCookie?.httpOnly).toBe(true);
    await expect(verifySessionToken(sessionCookie!.value)).resolves.toMatchObject({
      userId: "64b000000000000000000001",
      role: "patient",
    });
  });

  it("rejects a wrong password without issuing a session", async () => {
    userModel.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue({
      _id: { toString: () => "64b000000000000000000001" },
      passwordHash: "test-hash",
      role: "patient",
    }) });
    comparePassword.mockResolvedValue(false);

    const response = await login(jsonRequest("http://localhost/api/auth/login", {
      email: "patient@example.test", password: "WrongPass2026",
    }));

    expect(response.status).toBe(401);
    expect(response.cookies.get(COOKIE_NAME)?.value).toBeUndefined();
  });

  it("rejects malformed login and registration payloads before database access", async () => {
    const badLogin = await login(jsonRequest("http://localhost/api/auth/login", {
      email: "not-an-email", password: "",
    }));
    const badRegistration = await register(jsonRequest("http://localhost/api/auth/register", {
      fullName: "X", email: "not-an-email", password: "short",
    }));

    expect(badLogin.status).toBe(400);
    expect(badRegistration.status).toBe(400);
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("clears the session cookie on logout", async () => {
    const response = await logout();

    expect(response.status).toBe(200);
    expect(response.cookies.get(COOKIE_NAME)?.value).toBe("");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
