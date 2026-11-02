import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { writeAuditLog } from "@/lib/audit";
import Patient from "@/models/Patient";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(["receptionist", "administrator"]);
  if (auth.response) return auth.response;
  await connectDB();
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const users = await User.find({ role: "patient", ...(query ? { $or: [{ fullName: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }] } : {}) })
    .select("_id fullName email isActive createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const patients = await Patient.find({ userId: { $in: users.map((user) => user._id) } }).lean();
  return NextResponse.json({ patients: users.map((user) => ({ ...user, id: user._id.toString(), profile: patients.find((patient) => patient.userId.toString() === user._id.toString()) || null })) });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["receptionist"]);
  if (auth.response) return auth.response;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return NextResponse.json({ message: "Enter a valid patient name, email and password." }, { status: 400 });
    await connectDB();
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const [user] = await User.create([{ fullName, email, passwordHash: await bcrypt.hash(password, 12), role: "patient", accountStatus: "approved" }], { session });
        await Patient.create([{ userId: user._id, phone: typeof body.phone === "string" ? body.phone.trim() : undefined, address: typeof body.address === "string" ? body.address.trim() : undefined }], { session });
      });
    } finally {
      await session.endSession();
    }
    await writeAuditLog({ actorId: auth.user!.id, action: "patient_registered_by_reception", resourceType: "User", metadata: { email } });
    return NextResponse.json({ message: "Patient registered successfully." }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    console.error(error);
    return NextResponse.json({ message: "Unable to register patient." }, { status: 500 });
  }
}
