import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "administrator") {
    return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  }
  try {
    const body = (await request.json()) as { fullName?: string; email?: string; password?: string; role?: string };
    const fullName = body.fullName?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    const role = body.role === "administrator" || body.role === "receptionist" ? body.role : null;
    if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !body.password || body.password.length < 8 || !role) {
      return NextResponse.json({ message: "Enter a valid staff name, email, password, and role." }, { status: 400 });
    }
    await connectDB();
    await User.create({ fullName, email, passwordHash: await bcrypt.hash(body.password, 12), role, accountStatus: "approved" });
    return NextResponse.json({ message: "Staff account created." }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    }
    console.error("Staff account creation failed:", error);
    return NextResponse.json({ message: "Unable to create staff account." }, { status: 500 });
  }
}
