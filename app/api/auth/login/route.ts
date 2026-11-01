
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema } from "@/lib/validations/auth";
import {
  COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  createSessionToken,
} from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      email: parsed.data.email,
      isActive: true,
    }).select("+passwordHash");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.role === "doctor" && user.accountStatus !== "approved") {
      const message =
        user.accountStatus === "rejected"
          ? "Your doctor application was not approved. Please contact the hospital administrator."
          : "Your doctor application is awaiting administrator approval.";

      return NextResponse.json({ success: false, message }, { status: 403 });
    }

    const token = await createSessionToken({
      id: user._id.toString(),
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to log in right now." },
      { status: 500 }
    );
  }
}
