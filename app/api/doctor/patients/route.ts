import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";

type UserSummary = { fullName?: string; email?: string };

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(["doctor"]);
  if (auth.response) return auth.response;
  await connectDB();
  const doctor = await Doctor.findOne({ userId: auth.user!.id }).select("_id");
  if (!doctor) return NextResponse.json({ patients: [] });
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
  const appointments = await Appointment.find({ doctorId: doctor._id }).select("patientId status").lean();
  const patientIds = [...new Set(appointments.map((item) => item.patientId.toString()))];
  const patients = await Patient.find({ _id: { $in: patientIds } }).populate({ path: "userId", select: "fullName email isActive" }).lean();
  const results = patients.map((patient) => { const user = patient.userId as unknown as UserSummary | null; const patientAppointments = appointments.filter((item) => item.patientId.toString() === patient._id.toString()); return { id: patient._id.toString(), fullName: user?.fullName || "Patient", email: user?.email || "", visited: patientAppointments.some((item) => item.status === "completed"), appointmentCount: patientAppointments.length }; }).filter((patient) => !query || patient.fullName.toLowerCase().includes(query) || patient.email.toLowerCase().includes(query));
  return NextResponse.json({ patients: results });
}
