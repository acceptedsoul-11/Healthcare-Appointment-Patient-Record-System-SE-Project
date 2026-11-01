import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/models/Patient";
import User from "@/models/User";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "patient") {
    return NextResponse.json({ message: "Patient access is required." }, { status: 403 });
  }
  await connectDB();
  const patient = await Patient.findOne({ userId: currentUser.id }).lean();
  return NextResponse.json({
    profile: {
      fullName: currentUser.fullName,
      email: currentUser.email,
      phone: patient?.phone || "",
      dateOfBirth: patient?.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().slice(0, 10) : "",
      gender: patient?.gender || "prefer_not_to_say",
      address: patient?.address || "",
      emergencyContact: patient?.emergencyContact || { name: "", relationship: "", phone: "" },
    },
  });
}

export async function PATCH(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "patient") {
    return NextResponse.json({ message: "Patient access is required." }, { status: 403 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth : "";
    const gender = typeof body.gender === "string" ? body.gender : "prefer_not_to_say";
    const contact = body.emergencyContact && typeof body.emergencyContact === "object" ? body.emergencyContact as Record<string, unknown> : {};

    if (fullName.length < 2 || fullName.length > 100 || phone.length > 20 || address.length > 300 || !["male", "female", "other", "prefer_not_to_say"].includes(gender)) {
      return NextResponse.json({ message: "Please check your profile details." }, { status: 400 });
    }
    if (dateOfBirth && (Number.isNaN(new Date(`${dateOfBirth}T00:00:00.000Z`).getTime()) || new Date(dateOfBirth) > new Date())) {
      return NextResponse.json({ message: "Enter a valid date of birth." }, { status: 400 });
    }
    const emergencyContact = {
      name: typeof contact.name === "string" ? contact.name.trim().slice(0, 100) : "",
      relationship: typeof contact.relationship === "string" ? contact.relationship.trim().slice(0, 50) : "",
      phone: typeof contact.phone === "string" ? contact.phone.trim().slice(0, 20) : "",
    };
    await connectDB();
    await User.findByIdAndUpdate(currentUser.id, { fullName });
    await Patient.findOneAndUpdate(
      { userId: currentUser.id },
      {
        phone: phone || undefined,
        address: address || undefined,
        dateOfBirth: dateOfBirth ? new Date(`${dateOfBirth}T00:00:00.000Z`) : undefined,
        gender,
        emergencyContact: emergencyContact.name || emergencyContact.phone ? emergencyContact : undefined,
      },
      { new: true }
    );
    return NextResponse.json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("PATCH /api/profile failed:", error);
    return NextResponse.json({ message: "Unable to update your profile." }, { status: 500 });
  }
}
