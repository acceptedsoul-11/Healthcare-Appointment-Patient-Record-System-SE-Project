
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import MedicalRecord from "@/models/MedicalRecord";
import Patient from "@/models/Patient";
import { COOKIE_NAME } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    // Read the session token from the incoming HTTP request.
    const token = request.cookies.get(COOKIE_NAME)?.value ?? null;

    // Authenticate using the explicitly supplied token.
    const currentUser = await getCurrentUser(token);

    if (!currentUser) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    await connectDB();

    let filter: Record<string, unknown>;

    if (currentUser.role === "patient") {
      const patient = await Patient.findOne({
        userId: currentUser.id,
      }).select("_id");

      if (!patient) {
        return NextResponse.json({ records: [] });
      }

      filter = { patientId: patient._id };
    } else if (currentUser.role === "doctor") {
      const doctor = await Doctor.findOne({
        userId: currentUser.id,
      }).select("_id");

      if (!doctor) {
        return NextResponse.json({ records: [] });
      }

      filter = { doctorId: doctor._id };
    } else {
      return NextResponse.json(
        {
          message: "You are not authorized to view medical records.",
        },
        { status: 403 }
      );
    }

    const records = await MedicalRecord.find(filter)
      .sort({ visitDate: -1 })
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "fullName",
        },
      })
      .lean();

    return NextResponse.json({
      records: records.map((record) => {
        const doctor = record.doctorId as unknown as {
          userId?: { fullName?: string };
        } | null;

        return {
          id: record._id.toString(),
          visitDate: record.visitDate,
          diagnosis: record.diagnosis,
          treatmentNotes: record.treatmentNotes || "",
          doctorName:
            doctor?.userId?.fullName || "Doctor details unavailable",
          prescriptions: record.prescriptions || [],
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/records failed:", error);

    return NextResponse.json(
      { message: "Unable to retrieve medical records." },
      { status: 500 }
    );
  }
}
