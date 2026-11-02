import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import MedicalRecord from "@/models/MedicalRecord";
import Patient from "@/models/Patient";
import { doctorNameWithoutTitle } from "@/lib/display-names";

const currentVersionFilter = { $or: [{ isCurrent: true }, { isCurrent: { $exists: false } }] };

type PopulatedUser = { fullName?: string };
type RecordReference = { _id?: { toString(): string }; userId?: PopulatedUser; toString(): string };
type RecordDocument = {
  _id: { toString(): string };
  version?: number;
  isCurrent?: boolean;
  appointmentId?: { toString(): string } | null;
  patientId?: RecordReference | null;
  doctorId?: RecordReference | null;
  visitDate: Date;
  diagnosis: string;
  treatmentNotes?: string;
  doctorName?: string;
  prescriptions?: unknown[];
  followUpDate?: Date | null;
};

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

function cleanPrescriptions(value: unknown) {
  const prescriptions = Array.isArray(value) ? value : [];
  return prescriptions.slice(0, 30).map((item) => { const source = item as Record<string, unknown>; const text = (key: string, max: number) => typeof source[key] === "string" ? String(source[key]).trim().slice(0, max) : ""; return { medication: text("medication", 200), dosage: text("dosage", 100), frequency: text("frequency", 100), route: text("route", 100), timing: text("timing", 100), duration: text("duration", 100), quantity: text("quantity", 100), instructions: text("instructions", 500) }; }).filter((item) => item.medication && item.dosage && item.frequency);
}

function serialize(record: unknown) {
  const source = record as RecordDocument;
  const doctor = source.doctorId && "userId" in source.doctorId ? source.doctorId : null;
  const patient = source.patientId && "userId" in source.patientId ? source.patientId : null;
  const idString = (value: RecordReference | null | undefined) => value?._id?.toString() || value?.toString();
  return { id: source._id.toString(), version: source.version || 1, patientId: idString(patient || source.patientId), doctorId: idString(doctor || source.doctorId), patientName: patient?.userId?.fullName || "", visitDate: source.visitDate, diagnosis: source.diagnosis, treatmentNotes: source.treatmentNotes || "", doctorName: doctorNameWithoutTitle(doctor?.userId?.fullName || "Doctor details unavailable"), prescriptions: source.prescriptions || [], followUpDate: source.followUpDate || null };
}

export async function GET() {
  const auth = await requireApiUser(["patient", "doctor"]); if (auth.response) return auth.response;
  try {
    await connectDB(); const currentUser = auth.user!; const filter: Record<string, unknown> = { ...currentVersionFilter };
    if (currentUser.role === "patient") { const patient = await Patient.findOne({ userId: currentUser.id }).select("_id"); if (!patient) return NextResponse.json({ records: [] }); filter.patientId = patient._id; }
    else { const doctor = await Doctor.findOne({ userId: currentUser.id }).select("_id"); if (!doctor) return NextResponse.json({ records: [] }); filter.doctorId = doctor._id; }
    const records = await MedicalRecord.find(filter).sort({ visitDate: -1, version: -1 }).populate({ path: "doctorId", populate: { path: "userId", select: "fullName" } }).populate({ path: "patientId", populate: { path: "userId", select: "fullName email" } }).lean();
    return NextResponse.json({ records: keepNewestRecords(records).map(serialize) });
  } catch (error) { console.error("GET /api/records failed:", error); return NextResponse.json({ message: "Unable to retrieve medical records." }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(["doctor"]); if (auth.response) return auth.response;
  try {
    const body = (await request.json()) as Record<string, unknown>; const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : ""; const diagnosis = typeof body.diagnosis === "string" ? body.diagnosis.trim() : ""; const treatmentNotes = typeof body.treatmentNotes === "string" ? body.treatmentNotes.trim() : "";
    if (!mongoose.isValidObjectId(appointmentId) || !diagnosis || diagnosis.length > 2000 || treatmentNotes.length > 5000) return NextResponse.json({ message: "Appointment and diagnosis are required." }, { status: 400 });
    const prescriptions = cleanPrescriptions(body.prescriptions); if (Array.isArray(body.prescriptions) && body.prescriptions.length > 0 && !prescriptions.length) return NextResponse.json({ message: "Each medicine needs a name, dosage and frequency." }, { status: 400 });
    const followUpDate = typeof body.followUpDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.followUpDate) ? new Date(`${body.followUpDate}T00:00:00.000Z`) : undefined;
    await connectDB(); const doctor = await Doctor.findOne({ userId: auth.user!.id }).select("_id"); const appointment = await Appointment.findOne({ _id: appointmentId, doctorId: doctor?._id }).select("patientId doctorId status"); if (!doctor || !appointment) return NextResponse.json({ message: "You are not authorized for this appointment." }, { status: 403 });
    const record = await MedicalRecord.create({ patientId: appointment.patientId, doctorId: doctor._id, appointmentId: appointment._id, visitDate: new Date(), diagnosis, treatmentNotes: treatmentNotes || undefined, prescriptions, followUpDate, version: 1, isCurrent: true });
    if (["scheduled", "confirmed"].includes(appointment.status)) { appointment.status = "completed"; appointment.completedAt = new Date(); await appointment.save(); }
    const patient = await Patient.findById(appointment.patientId).select("userId"); if (patient) await createNotification({ userId: patient.userId, type: "prescription", title: "Consultation record available", message: "Your doctor has added a consultation record and prescription.", resourceType: "MedicalRecord", resourceId: record._id }); if (followUpDate && patient) await createNotification({ userId: patient.userId, type: "follow_up", title: "Follow-up recommended", message: `Your doctor recommended a follow-up on ${body.followUpDate}.`, resourceType: "MedicalRecord", resourceId: record._id }); await writeAuditLog({ actorId: auth.user!.id, action: "medical_record_created", resourceType: "MedicalRecord", resourceId: record._id, metadata: { patientId: appointment.patientId.toString(), version: 1 } });
    return NextResponse.json({ message: "Consultation record saved.", record: { id: record._id.toString(), version: 1 } }, { status: 201 });
  } catch (error) { console.error("POST /api/records failed:", error); return NextResponse.json({ message: "Unable to save the consultation record." }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(["doctor"]); if (auth.response) return auth.response;
  try {
    const body = (await request.json()) as Record<string, unknown>; const recordId = typeof body.recordId === "string" ? body.recordId : ""; const diagnosis = typeof body.diagnosis === "string" ? body.diagnosis.trim() : ""; const treatmentNotes = typeof body.treatmentNotes === "string" ? body.treatmentNotes.trim() : "";
    if (!mongoose.isValidObjectId(recordId) || !diagnosis || diagnosis.length > 2000 || treatmentNotes.length > 5000) return NextResponse.json({ message: "A valid record, diagnosis and treatment notes are required." }, { status: 400 });
    const prescriptions = cleanPrescriptions(body.prescriptions); if (!prescriptions.length) return NextResponse.json({ message: "Add at least one medicine with dosage and frequency." }, { status: 400 });
    const followUpDate = typeof body.followUpDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.followUpDate) ? new Date(`${body.followUpDate}T00:00:00.000Z`) : undefined;
    await connectDB(); const doctor = await Doctor.findOne({ userId: auth.user!.id }).select("_id"); const previous = await MedicalRecord.findOne({ _id: recordId, doctorId: doctor?._id, ...currentVersionFilter }); if (!doctor || !previous) return NextResponse.json({ message: "You are not authorized to edit this record." }, { status: 403 });
    const nextVersion = (previous.version || 1) + 1;
    previous.diagnosis = diagnosis;
    previous.treatmentNotes = treatmentNotes || undefined;
    previous.prescriptions = prescriptions;
    previous.followUpDate = followUpDate;
    previous.version = nextVersion;
    previous.isCurrent = true;
    previous.supersededAt = undefined;
    previous.supersededBy = undefined;
    await previous.save();
    if (previous.appointmentId) {
      await MedicalRecord.deleteMany({ appointmentId: previous.appointmentId, doctorId: previous.doctorId, patientId: previous.patientId, _id: { $ne: previous._id } });
    }
    await writeAuditLog({ actorId: auth.user!.id, action: "medical_record_edited", resourceType: "MedicalRecord", resourceId: previous._id, metadata: { version: nextVersion, previousVersionsRemoved: true } });
    return NextResponse.json({ message: "Prescription updated. Previous versions were removed.", record: { id: previous._id.toString(), version: nextVersion } });
  } catch (error) { console.error("PATCH /api/records failed:", error); return NextResponse.json({ message: "Unable to update the prescription." }, { status: 500 }); }
}
