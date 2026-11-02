import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import User from "@/models/User";

const mimeTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(["patient", "doctor", "receptionist", "administrator"]);
  if (auth.response) return auth.response;
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ message: "Invalid doctor photo." }, { status: 400 });
  try {
    await connectDB();
    const doctor = await Doctor.findById(id).select("profileImageStorageKey profileImageUrl userId");
    if (!doctor) return NextResponse.json({ message: "Doctor not found." }, { status: 404 });
    const doctorUser = await User.findById(doctor.userId).select("isActive accountStatus");
    if (!doctorUser?.isActive || doctorUser.accountStatus !== "approved") return NextResponse.json({ message: "Doctor photo unavailable." }, { status: 404 });
    if (doctor.profileImageUrl) return NextResponse.redirect(doctor.profileImageUrl);
    if (!doctor.profileImageStorageKey) return NextResponse.json({ message: "Doctor photo unavailable." }, { status: 404 });
    const extension = doctor.profileImageStorageKey.split(".").pop()?.toLowerCase() || "";
    const data = await readFile(path.join(process.cwd(), process.env.PRIVATE_UPLOAD_DIR || ".private-uploads", doctor.profileImageStorageKey));
    return new NextResponse(data, { headers: { "Content-Type": mimeTypes[extension] || "application/octet-stream", "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    console.error("GET /api/doctor-photos failed:", error);
    return NextResponse.json({ message: "Unable to load doctor photo." }, { status: 404 });
  }
}
