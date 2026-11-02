import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import User from "@/models/User";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 5 * 1024 * 1024;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function storeProfileImage(file: File) {
  if (!allowedImageTypes.has(file.type) || file.size > maxImageBytes) {
    throw new Error("Profile photos must be a JPG, PNG, or WebP image under 5 MB.");
  }

  const storageRoot = path.join(process.cwd(), process.env.PRIVATE_UPLOAD_DIR || ".private-uploads");
  const storageKey = `doctor-profiles/${randomUUID()}.${file.type.split("/")[1] || "bin"}`;
  const absolutePath = path.join(storageRoot, storageKey);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
  return { storageKey };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fullName = readText(formData, "fullName");
    const email = readText(formData, "email").toLowerCase();
    const password = readText(formData, "password");
    const phone = readText(formData, "phone");
    const specialization = readText(formData, "specialization");
    const qualifications = readText(formData, "qualifications")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const experienceYears = Number(readText(formData, "experienceYears"));
    const consultationFee = Number(readText(formData, "consultationFee"));
    const bio = readText(formData, "bio");
    const licenseNumber = readText(formData, "licenseNumber");
    const credentialDetails = readText(formData, "credentialDetails");

    let availability: unknown;
    try {
      availability = JSON.parse(readText(formData, "availability") || "[]");
    } catch {
      availability = [];
    }

    if (
      fullName.length < 2 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      password.length < 8 ||
      !specialization ||
      qualifications.length === 0 ||
      !Number.isInteger(experienceYears) ||
      experienceYears < 0 ||
      !Number.isFinite(consultationFee) ||
      consultationFee < 0 ||
      !licenseNumber ||
      !Array.isArray(availability) ||
      availability.length === 0
    ) {
      return NextResponse.json(
        { message: "Please complete all required professional details and availability." },
        { status: 400 }
      );
    }

    const seenDays = new Set<number>();
    const availabilityIsValid = availability.every((slot) => {
      if (!slot || typeof slot !== "object") return false;
      const item = slot as Record<string, unknown>;
      return (
        Number.isInteger(item.dayOfWeek) &&
        Number(item.dayOfWeek) >= 0 &&
        Number(item.dayOfWeek) <= 6 &&
        !seenDays.has(Number(item.dayOfWeek)) &&
        typeof item.startTime === "string" &&
        typeof item.endTime === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime) &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(item.endTime) &&
        item.startTime < item.endTime &&
        Boolean(seenDays.add(Number(item.dayOfWeek)))
      );
    });

    if (!availabilityIsValid) {
      return NextResponse.json({ message: "Please provide valid availability hours." }, { status: 400 });
    }

    const photo = formData.get("profilePhoto");
    const uploadedImage = photo instanceof File && photo.size > 0 ? await storeProfileImage(photo) : null;

    await connectDB();
    const passwordHash = await bcrypt.hash(password, 12);
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const [user] = await User.create(
          [{ fullName, email, passwordHash, role: "doctor", accountStatus: "pending" }],
          { session }
        );
        await Doctor.create(
          [
            {
              userId: user._id,
              phone: phone || undefined,
              specialization,
              qualification: qualifications,
              experienceYears,
              consultationFee,
              bio: bio || undefined,
              licenseNumber,
              credentialDetails: credentialDetails || undefined,
              availability,
              profileImageStorageKey: uploadedImage?.storageKey,
            },
          ],
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(
      { message: "Your doctor application has been received and is awaiting administrator approval." },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Unable to submit your application.";
    console.error("Doctor registration failed:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
