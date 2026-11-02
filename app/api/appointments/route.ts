import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireApiUser } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";
import Appointment, { type AppointmentStatus } from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import User from "@/models/User";
import { doctorNameWithoutTitle } from "@/lib/display-names";

const activeStatuses: AppointmentStatus[] = ["scheduled", "confirmed"];
const transitions: Record<AppointmentStatus, AppointmentStatus[]> = { scheduled: ["confirmed", "cancelled", "no_show"], confirmed: ["completed", "cancelled", "no_show"], completed: [], cancelled: [], no_show: [] };

function minutes(value: string) { const [hour, minute] = value.split(":").map(Number); return hour * 60 + minute; }
function dateOnly(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null; const date = new Date(`${value}T00:00:00.000Z`); return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date; }
function isFutureInHospitalTime(dateValue: string, startTime: string) { const [year, month, day] = dateValue.split("-").map(Number); const [hour, minute] = startTime.split(":").map(Number); return new Date(Date.UTC(year, month - 1, day, hour - 5, minute - 30)) > new Date(); }

type AppointmentDisplayDocument = { _id: { toString(): string }; appointmentDate: Date; startTime: string; endTime: string; durationMinutes?: number; reason: string; status: AppointmentStatus; notes?: string; checkedInAt?: Date | null; patientId?: { _id: { toString(): string }; userId?: { fullName?: string; email?: string } } | null; doctorId?: { _id: { toString(): string }; userId?: { fullName?: string; email?: string }; specialization?: string; consultationFee?: number } | null };

async function validateSlot(doctorId: string, appointmentDate: string, startTime: string, durationMinutes: number, excludeId?: string) {
  const date = dateOnly(appointmentDate);
  if (!date) return { error: "Invalid appointment date." };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) return { error: "Invalid appointment time." };
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) return { error: "Appointment duration must be between 15 and 240 minutes." };
  if (!isFutureInHospitalTime(appointmentDate, startTime)) return { error: "Please select a future appointment date and time." };
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return { error: "The selected doctor was not found." };
  const doctorUser = await User.findById(doctor.userId).select("isActive accountStatus");
  if (!doctorUser?.isActive || doctorUser.accountStatus !== "approved") return { error: "The selected doctor is not currently available for bookings." };
  const slot = doctor.availability.find((item) => item.dayOfWeek === date.getUTCDay());
  if (!slot) return { error: "This doctor is not available on the selected day." };
  const start = minutes(startTime); const end = start + durationMinutes;
  if (start < minutes(slot.startTime) || end > minutes(slot.endTime)) return { error: "The selected time is outside the doctor's available hours." };
  const conflictFilter: Record<string, unknown> = { doctorId, appointmentDate: date, status: { $in: activeStatuses } };
  if (excludeId) conflictFilter._id = { $ne: excludeId };
  const conflicting = await Appointment.findOne(conflictFilter).select("startTime endTime").lean();
  if (conflicting && start < minutes(conflicting.endTime) && end > minutes(conflicting.startTime)) return { error: "That time slot has already been booked. Please choose another." };
  return { date, doctor };
}

function serialize(appointment: AppointmentDisplayDocument) {
  const patient = appointment.patientId; const doctor = appointment.doctorId;
  return { id: appointment._id.toString(), appointmentDate: appointment.appointmentDate, startTime: appointment.startTime, endTime: appointment.endTime, durationMinutes: appointment.durationMinutes || 30, reason: appointment.reason, status: appointment.status, notes: appointment.notes || "", checkedInAt: appointment.checkedInAt || null, patient: patient ? { id: patient._id.toString(), name: patient.userId?.fullName || "Patient", email: patient.userId?.email || "" } : null, doctor: doctor ? { id: doctor._id.toString(), name: doctorNameWithoutTitle(doctor.userId?.fullName || "Doctor"), email: doctor.userId?.email || "", specialization: doctor.specialization || "", consultationFee: doctor.consultationFee ?? 0 } : null };
}

export async function GET() {
  const auth = await requireApiUser(["patient", "doctor", "receptionist", "administrator"]); if (auth.response) return auth.response;
  try { await connectDB(); const currentUser = auth.user!; const filter: Record<string, unknown> = {};
    if (currentUser.role === "patient") { const patient = await Patient.findOne({ userId: currentUser.id }).select("_id"); if (!patient) return NextResponse.json({ appointments: [] }); filter.patientId = patient._id; }
    else if (currentUser.role === "doctor") { const doctor = await Doctor.findOne({ userId: currentUser.id }).select("_id"); if (!doctor) return NextResponse.json({ appointments: [] }); filter.doctorId = doctor._id; }
    const appointments = await Appointment.find(filter).sort({ appointmentDate: 1, startTime: 1 }).populate({ path: "patientId", populate: { path: "userId", select: "fullName email" } }).populate({ path: "doctorId", populate: { path: "userId", select: "fullName email" } }).lean();
    return NextResponse.json({ appointments: appointments.map(serialize) });
  } catch (error) { console.error("GET /api/appointments failed:", error); return NextResponse.json({ message: "Unable to retrieve appointments." }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(["patient", "receptionist"]); if (auth.response) return auth.response;
  try { const body = (await request.json()) as Record<string, unknown>; const doctorId = typeof body.doctorId === "string" ? body.doctorId.trim() : ""; const appointmentDate = typeof body.appointmentDate === "string" ? body.appointmentDate.trim() : ""; const startTime = typeof body.startTime === "string" ? body.startTime.trim() : ""; const reason = typeof body.reason === "string" ? body.reason.trim() : ""; const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : 30;
    if (!mongoose.isValidObjectId(doctorId) || !reason || reason.length > 500) return NextResponse.json({ message: "Doctor and a valid reason are required." }, { status: 400 });
    await connectDB(); const slot = await validateSlot(doctorId, appointmentDate, startTime, durationMinutes); if (slot.error) return NextResponse.json({ message: slot.error }, { status: 400 });
    let patientId: mongoose.Types.ObjectId | undefined; if (auth.user!.role === "patient") { const patient = await Patient.findOne({ userId: auth.user!.id }).select("_id"); patientId = patient?._id; } else if (typeof body.patientId === "string" && mongoose.isValidObjectId(body.patientId)) patientId = new mongoose.Types.ObjectId(body.patientId);
    if (!patientId || !(await Patient.exists({ _id: patientId }))) return NextResponse.json({ message: "A valid patient is required." }, { status: 400 });
    const end = minutes(startTime) + durationMinutes; const appointment = await Appointment.create({ patientId, doctorId, appointmentDate: slot.date, startTime, endTime: `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`, durationMinutes, reason, status: "scheduled" });
    await createNotification({ userId: slot.doctor!.userId, type: "appointment", title: "New appointment booked", message: `A patient appointment is scheduled for ${appointmentDate} at ${startTime}.`, resourceType: "Appointment", resourceId: appointment._id }); await writeAuditLog({ actorId: auth.user!.id, action: "appointment_created", resourceType: "Appointment", resourceId: appointment._id, metadata: { role: auth.user!.role } });
    return NextResponse.json({ message: "Appointment booked successfully.", appointment: serialize(appointment) }, { status: 201 });
  } catch (error) { console.error("POST /api/appointments failed:", error); return NextResponse.json({ message: "Unable to book the appointment." }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(["patient", "doctor", "receptionist", "administrator"]); if (auth.response) return auth.response;
  try { const body = (await request.json()) as Record<string, unknown>; const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : ""; const action = typeof body.action === "string" ? body.action : ""; if (!mongoose.isValidObjectId(appointmentId)) return NextResponse.json({ message: "A valid appointment is required." }, { status: 400 });
    await connectDB(); const appointment = await Appointment.findById(appointmentId); if (!appointment) return NextResponse.json({ message: "Appointment not found." }, { status: 404 }); const currentUser = auth.user!; const patient = await Patient.findById(appointment.patientId).select("userId"); const doctor = await Doctor.findById(appointment.doctorId).select("userId"); const isPatientOwner = patient?.userId.toString() === currentUser.id; const isDoctorOwner = doctor?.userId.toString() === currentUser.id; const staff = currentUser.role === "receptionist" || currentUser.role === "administrator";
    if (action === "cancel") { if (!isPatientOwner && !staff && !isDoctorOwner) return NextResponse.json({ message: "You cannot cancel this appointment." }, { status: 403 }); if (!transitions[appointment.status].includes("cancelled")) return NextResponse.json({ message: "This appointment cannot be cancelled." }, { status: 409 }); appointment.status = "cancelled"; appointment.cancelledAt = new Date(); appointment.cancelledBy = new mongoose.Types.ObjectId(currentUser.id); await appointment.save(); await createNotification({ userId: patient!.userId, type: "appointment", title: "Appointment cancelled", message: "Your appointment has been cancelled.", resourceType: "Appointment", resourceId: appointment._id }); await writeAuditLog({ actorId: currentUser.id, action: "appointment_cancelled", resourceType: "Appointment", resourceId: appointment._id }); }
    else if (action === "reschedule") { if (!isPatientOwner && !staff) return NextResponse.json({ message: "You cannot reschedule this appointment." }, { status: 403 }); if (!activeStatuses.includes(appointment.status)) return NextResponse.json({ message: "Only scheduled appointments can be rescheduled." }, { status: 409 }); const appointmentDate = typeof body.appointmentDate === "string" ? body.appointmentDate : ""; const startTime = typeof body.startTime === "string" ? body.startTime : ""; const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : appointment.durationMinutes || 30; const slot = await validateSlot(appointment.doctorId.toString(), appointmentDate, startTime, durationMinutes, appointment.id); if (slot.error) return NextResponse.json({ message: slot.error }, { status: 400 }); const end = minutes(startTime) + durationMinutes; appointment.appointmentDate = slot.date!; appointment.startTime = startTime; appointment.durationMinutes = durationMinutes; appointment.endTime = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`; appointment.status = "scheduled"; await appointment.save(); await createNotification({ userId: patient!.userId, type: "appointment", title: "Appointment rescheduled", message: `Your appointment is now scheduled for ${appointmentDate} at ${startTime}.`, resourceType: "Appointment", resourceId: appointment._id }); await createNotification({ userId: doctor!.userId, type: "appointment", title: "Appointment rescheduled", message: `An appointment was moved to ${appointmentDate} at ${startTime}.`, resourceType: "Appointment", resourceId: appointment._id }); await writeAuditLog({ actorId: currentUser.id, action: "appointment_rescheduled", resourceType: "Appointment", resourceId: appointment._id }); }
    else if (["confirm", "complete", "no_show", "check_in"].includes(action)) { if (["confirm", "complete", "no_show"].includes(action) && !isDoctorOwner) return NextResponse.json({ message: "Only the assigned doctor can update this status." }, { status: 403 }); if (action === "check_in" && !staff) return NextResponse.json({ message: "Reception staff access is required for check-in." }, { status: 403 }); if (action === "check_in" && (!activeStatuses.includes(appointment.status) || appointment.checkedInAt)) return NextResponse.json({ message: "Only scheduled or confirmed appointments can be checked in, and each visit can be checked in once." }, { status: 409 }); const nextStatus: AppointmentStatus = action === "confirm" ? "confirmed" : action === "complete" ? "completed" : action === "no_show" ? "no_show" : appointment.status; if (action !== "check_in" && !transitions[appointment.status].includes(nextStatus)) return NextResponse.json({ message: "That appointment status transition is not allowed." }, { status: 409 }); if (action !== "check_in") appointment.status = nextStatus; if (action === "check_in") appointment.checkedInAt = new Date(); if (action === "confirm") appointment.confirmedAt = new Date(); if (action === "complete") appointment.completedAt = new Date(); await appointment.save(); await createNotification({ userId: patient!.userId, type: "appointment", title: `Appointment ${action.replace("_", " ")}`, message: `Your appointment status is now ${action.replace("_", " ")}.`, resourceType: "Appointment", resourceId: appointment._id }); await writeAuditLog({ actorId: currentUser.id, action: `appointment_${action}`, resourceType: "Appointment", resourceId: appointment._id }); }
    else return NextResponse.json({ message: "Unsupported appointment action." }, { status: 400 });
    return NextResponse.json({ message: "Appointment updated successfully.", appointment: serialize(appointment) });
  } catch (error) { console.error("PATCH /api/appointments failed:", error); return NextResponse.json({ message: "Unable to update the appointment." }, { status: 500 }); }
}
