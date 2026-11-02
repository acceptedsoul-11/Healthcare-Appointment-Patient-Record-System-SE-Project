import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";
import { doctorNameWithoutTitle } from "@/lib/display-names";

type UserSummary = { fullName?: string; email?: string };
type PopulatedReference = { userId?: UserSummary };

function keepNewestRecords<T extends { isCurrent?: boolean; appointmentId?: { toString(): string } | null }>(records: T[]) {
  const seenAppointments = new Set<string>();
  return records.filter((record) => {
    if (record.isCurrent === false || record.isCurrent === true || !record.appointmentId) return record.isCurrent !== false;
    const appointmentKey = record.appointmentId.toString();
    if (seenAppointments.has(appointmentKey)) return false;
    seenAppointments.add(appointmentKey);
    return true;
  });
}

export async function GET(request: NextRequest) { const auth = await requireApiUser(["receptionist", "administrator"]); if (auth.response) return auth.response; const patientId = request.nextUrl.searchParams.get("patientId") || ""; await connectDB(); const filter: Record<string, unknown> = { $or: [{ isCurrent: true }, { isCurrent: { $exists: false } }] }; if (patientId) filter.patientId = patientId; const records = await MedicalRecord.find(filter).sort({ visitDate: -1, createdAt: -1, version: -1 }).limit(100).populate({ path: "patientId", populate: { path: "userId", select: "fullName email" } }).populate({ path: "doctorId", populate: { path: "userId", select: "fullName" } }).lean(); for (const record of records) { const doctor = record.doctorId as unknown as PopulatedReference | null; if (doctor?.userId?.fullName) doctor.userId.fullName = doctorNameWithoutTitle(doctor.userId.fullName); } return NextResponse.json({ prescriptions: keepNewestRecords(records).flatMap((record) => (record.prescriptions || []).map((prescription) => ({ ...prescription, recordId: record._id.toString(), version: record.version || 1, diagnosis: record.diagnosis, visitDate: record.visitDate, patient: (record.patientId as unknown as PopulatedReference | null)?.userId || null, doctor: (record.doctorId as unknown as PopulatedReference | null)?.userId || null }))) }); }
