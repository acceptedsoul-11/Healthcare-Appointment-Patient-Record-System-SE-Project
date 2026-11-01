import { createHash } from "crypto";
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

async function uploadProfileImage(file: File) {
  if (!allowedImageTypes.has(file.type) || file.size > maxImageBytes) {
    throw new Error("Profile photos must be a JPG, PNG, or WebP image under 5 MB.");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Photo uploads are not configured yet. Please contact the hospital administrator.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "curewell/doctor-profiles";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const upload = new FormData();
  upload.append("file", file);
  upload.append("api_key", apiKey);
  upload.append("timestamp", String(timestamp));
  upload.append("folder", folder);
  upload.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: upload }
  );
  const payload = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Unable to upload the profile photo.");
  }

  return { url: payload.secure_url, publicId: payload.public_id || "" };
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

    const availabilityIsValid = availability.every((slot) => {
      if (!slot || typeof slot !== "object") return false;
      const item = slot as Record<string, unknown>;
      return (
        Number.isInteger(item.dayOfWeek) &&
        Number(item.dayOfWeek) >= 0 &&
        Number(item.dayOfWeek) <= 6 &&
        typeof item.startTime === "string" &&
        typeof item.endTime === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime) &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(item.endTime) &&
        item.startTime < item.endTime
      );
    });

    if (!availabilityIsValid) {
      return NextResponse.json({ message: "Please provide valid availability hours." }, { status: 400 });
    }

    const photo = formData.get("profilePhoto");
    const uploadedImage = photo instanceof File && photo.size > 0 ? await uploadProfileImage(photo) : null;

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
              profileImageUrl: uploadedImage?.url,
              profileImagePublicId: uploadedImage?.publicId || undefined,
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
