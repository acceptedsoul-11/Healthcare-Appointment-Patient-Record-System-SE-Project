
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Please sign in to view doctors." },
        { status: 401 }
      );
    }

    await connectDB();

    const doctors = await Doctor.find({})
      .select(
        "userId specialization qualification consultationFee experienceYears bio availability profileImageUrl"
      )
      .populate({
        path: "userId",
        select: "fullName email accountStatus isActive",
        match: {
          isActive: true,
          $or: [
            { accountStatus: "approved" },
            { accountStatus: { $exists: false } },
          ],
        },
      })
      .lean();

    const result = doctors
      .filter(
        (doctor) =>
          doctor.userId !== null &&
          typeof doctor.userId === "object" &&
          "fullName" in doctor.userId
      )
      .map((doctor) => {
        const user = doctor.userId as unknown as {
          fullName: string;
        };

        return {
          id: doctor._id.toString(),
          name: user.fullName,
          specialization: doctor.specialization,
          qualification: doctor.qualification,
          consultationFee: doctor.consultationFee,
          experienceYears: doctor.experienceYears,
          bio: doctor.bio || "",
          profileImageUrl: doctor.profileImageUrl || "",
          availability: doctor.availability,
        };
      });

    return NextResponse.json({ doctors: result });
  } catch (error) {
    console.error("GET /api/doctors failed:", error);

    return NextResponse.json(
      { message: "Unable to retrieve doctors." },
      { status: 500 }
    );
  }
}
