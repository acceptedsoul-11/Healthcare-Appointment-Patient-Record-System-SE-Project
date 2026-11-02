import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import MedicalReport from "@/models/MedicalReport";
import Patient from "@/models/Patient";

export async function GET() {
  const auth = await requireApiUser(["patient", "doctor"]); if (auth.response) return auth.response;
  try { await connectDB(); const currentUser = auth.user!; const filter: Record<string, unknown> = {};
    if (currentUser.role === "patient") { const patient = await Patient.findOne({ userId: currentUser.id }).select("_id"); filter.patientId = patient?._id; }
    else { const doctor = await Doctor.findOne({ userId: currentUser.id }).select("_id"); const appointments = doctor ? await Appointment.find({ doctorId: doctor._id }).select("patientId") : []; filter.patientId = { $in: appointments.map((item) => item.patientId) }; }
    const reports = await MedicalReport.find(filter).sort({ createdAt: -1 }).select("_id patientId fileName mimeType size description createdAt appointmentId").lean(); return NextResponse.json({ reports: reports.map((report) => ({ ...report, id: report._id.toString(), patientId: report.patientId.toString(), downloadUrl: `/api/medical-reports/download?id=${report._id.toString()}` })) });
  } catch (error) { console.error(error); return NextResponse.json({ message: "Unable to retrieve medical reports." }, { status: 500 }); }
}

export async function POST() {
  return NextResponse.json({ message: "Medical report uploads are disabled." }, { status: 410 });
}
