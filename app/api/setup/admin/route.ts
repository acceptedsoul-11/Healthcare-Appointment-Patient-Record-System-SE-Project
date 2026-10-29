import { timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function secretMatches(candidate: string, expected: string) {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!setupSecret) {
      return NextResponse.json({ message: "Initial administrator setup is not configured." }, { status: 503 });
    }
    const body = (await request.json()) as { secret?: string; fullName?: string; email?: string; password?: string };
    if (!body.secret || !secretMatches(body.secret, setupSecret)) {
      return NextResponse.json({ message: "Invalid setup secret." }, { status: 403 });
    }
    const fullName = body.fullName?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !body.password || body.password.length < 8) {
      return NextResponse.json({ message: "Enter a valid name, email, and password of at least 8 characters." }, { status: 400 });
    }
    await connectDB();
    if (await User.exists({ role: "administrator" })) {
      return NextResponse.json({ message: "An administrator already exists; initial setup is disabled." }, { status: 410 });
    }
    await User.create({ fullName, email, passwordHash: await bcrypt.hash(body.password, 12), role: "administrator", accountStatus: "approved" });
    return NextResponse.json({ message: "Initial administrator account created. You can now sign in." }, { status: 201 });
  } catch (error) {
    console.error("Initial administrator setup failed:", error);
    return NextResponse.json({ message: "Unable to create the administrator account." }, { status: 500 });
  }
}
