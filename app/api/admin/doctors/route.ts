import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import User from "@/models/User";

async function requireAdministrator() {
  const currentUser = await getCurrentUser();
  return currentUser?.role === "administrator" ? currentUser : null;
}

export async function GET() {
  if (!(await requireAdministrator())) {
    return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  }

  try {
    await connectDB();
    const doctors = await Doctor.find({})
      .populate({ path: "userId", select: "fullName email accountStatus isActive createdAt" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      doctors: doctors
        .filter((doctor) => doctor.userId)
        .map((doctor) => {
          const user = doctor.userId as unknown as {
            _id: { toString(): string };
            fullName: string;
            email: string;
            accountStatus?: string;
            isActive: boolean;
            createdAt: Date;
          };
          return {
            id: doctor._id.toString(),
            userId: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            accountStatus: user.accountStatus || "approved",
            isActive: user.isActive,
            specialization: doctor.specialization,
            qualification: doctor.qualification,
            experienceYears: doctor.experienceYears,
            consultationFee: doctor.consultationFee,
            phone: doctor.phone || "",
            bio: doctor.bio || "",
            profileImageUrl: doctor.profileImageUrl || "",
            licenseNumber: doctor.licenseNumber || "",
            credentialDetails: doctor.credentialDetails || "",
            availability: doctor.availability,
            createdAt: user.createdAt,
          };
        }),
    });
  } catch (error) {
    console.error("GET /api/admin/doctors failed:", error);
    return NextResponse.json({ message: "Unable to load doctor applications." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdministrator())) {
    return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { doctorId?: string; status?: string };
    if (!body.doctorId || !/^[a-f\d]{24}$/i.test(body.doctorId) || !["approved", "rejected"].includes(body.status || "")) {
      return NextResponse.json({ message: "A doctor and approval decision are required." }, { status: 400 });
    }
    await connectDB();
    const doctor = await Doctor.findById(body.doctorId).select("userId");
    if (!doctor) return NextResponse.json({ message: "Doctor application not found." }, { status: 404 });
    await User.findByIdAndUpdate(doctor.userId, { accountStatus: body.status });
    return NextResponse.json({ message: `Doctor application ${body.status}.` });
  } catch (error) {
    console.error("PATCH /api/admin/doctors failed:", error);
    return NextResponse.json({ message: "Unable to update the doctor application." }, { status: 500 });
  }
}
