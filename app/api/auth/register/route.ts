
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Patient from "@/models/Patient";
import { patientRegistrationSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = patientRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check your registration details.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    await connectDB();

    const passwordHash = await bcrypt.hash(data.password, 12);

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const [user] = await User.create(
          [
            {
              fullName: data.fullName,
              email: data.email,
              passwordHash,
              role: "patient",
            },
          ],
          { session }
        );

        await Patient.create(
          [
            {
              userId: user._id,
              ...(data.phone ? { phone: data.phone } : {}),
              ...(data.address ? { address: data.address } : {}),
              ...(data.dateOfBirth
                ? {
                    dateOfBirth: new Date(
                      `${data.dateOfBirth}T00:00:00.000Z`
                    ),
                  }
                : {}),
            },
          ],
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Patient account created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    console.error("Patient registration failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Registration failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
