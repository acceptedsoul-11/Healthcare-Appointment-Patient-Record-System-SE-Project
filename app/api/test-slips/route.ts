import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import TestSlip from "@/models/TestSlip";
import { doctorNameWithoutTitle } from "@/lib/display-names";

function slipNumber() {
  return `CW-TS-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const currentVersionFilter = { $or: [{ isCurrent: true }, { isCurrent: { $exists: false } }] };

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(["patient", "doctor", "receptionist", "administrator"]);
  if (auth.response) return auth.response;
  await connectDB();
  const role = auth.user!.role;
  const filter: Record<string, unknown> = { ...currentVersionFilter };
  if (role === "patient") {
    const patient = await Patient.findOne({ userId: auth.user!.id }).select("_id");
    filter.patientId = patient?._id;
  } else if (role === "doctor") {
    const doctor = await Doctor.findOne({ userId: auth.user!.id }).select("_id");
    filter.doctorId = doctor?._id;
  } else {
    const patientId = request.nextUrl.searchParams.get("patientId") || "";
    if (patientId) {
      if (!mongoose.isValidObjectId(patientId)) return NextResponse.json({ message: "Invalid patient reference." }, { status: 400 });
      filter.patientId = patientId;
    }
  }
  const slips = await TestSlip.find(filter)
    .sort({ issuedAt: -1 })
    .populate({ path: "patientId", populate: { path: "userId", select: "fullName email" } })
    .populate({ path: "doctorId", populate: { path: "userId", select: "fullName email" } })
    .lean();
  for (const slip of slips) {
    const doctor = slip.doctorId as unknown as { userId?: { fullName?: string } } | null;
    if (doctor?.userId?.fullName) doctor.userId.fullName = doctorNameWithoutTitle(doctor.userId.fullName);
  }
  return NextResponse.json({ slips });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(["doctor"]);
  if (auth.response) return auth.response;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : "";
    const tests = Array.isArray(body.tests) ? body.tests : [];
    if (!mongoose.isValidObjectId(appointmentId) || !tests.length) return NextResponse.json({ message: "Appointment and at least one test are required." }, { status: 400 });
    await connectDB();
    const doctor = await Doctor.findOne({ userId: auth.user!.id }).select("_id");
    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId: doctor?._id }).select("patientId doctorId");
    if (!doctor || !appointment) return NextResponse.json({ message: "You are not authorized for this appointment." }, { status: 403 });
    const cleaned = tests.slice(0, 20).map((item) => item as Record<string, unknown>).map((item) => ({ name: typeof item.name === "string" ? item.name.trim().slice(0, 200) : "", instructions: typeof item.instructions === "string" ? item.instructions.trim().slice(0, 1000) : "" })).filter((item) => item.name);
    if (!cleaned.length) return NextResponse.json({ message: "Enter valid test names." }, { status: 400 });
    const slip = await TestSlip.create({ slipNumber: slipNumber(), patientId: appointment.patientId, doctorId: doctor._id, appointmentId: appointment._id, tests: cleaned, status: "issued", version: 1, isCurrent: true });
    const patient = await Patient.findById(appointment.patientId).select("userId");
    if (patient) await createNotification({ userId: patient.userId, type: "test_slip", title: "New test slip issued", message: `Your doctor issued test slip ${slip.slipNumber}.`, resourceType: "TestSlip", resourceId: slip._id });
    await writeAuditLog({ actorId: auth.user!.id, action: "test_slip_created", resourceType: "TestSlip", resourceId: slip._id });
    return NextResponse.json({ message: "Test slip issued.", slip }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unable to issue test slip." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(["doctor"]);
  if (auth.response) return auth.response;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const slipId = typeof body.slipId === "string" ? body.slipId : "";
    const tests = Array.isArray(body.tests) ? body.tests : [];
    if (!mongoose.isValidObjectId(slipId) || !tests.length) return NextResponse.json({ message: "A valid test slip and at least one test are required." }, { status: 400 });
    const cleaned = tests.slice(0, 20).map((item) => item as Record<string, unknown>).map((item) => ({ name: typeof item.name === "string" ? item.name.trim().slice(0, 200) : "", instructions: typeof item.instructions === "string" ? item.instructions.trim().slice(0, 1000) : "" })).filter((item) => item.name);
    if (!cleaned.length) return NextResponse.json({ message: "Enter valid test names." }, { status: 400 });
    await connectDB();
    const doctor = await Doctor.findOne({ userId: auth.user!.id }).select("_id");
    const previous = await TestSlip.findOne({ _id: slipId, doctorId: doctor?._id, ...currentVersionFilter });
    if (!doctor || !previous) return NextResponse.json({ message: "You are not authorized to edit this test slip." }, { status: 403 });
    const nextVersion = (previous.version || 1) + 1;
    const replacement = await TestSlip.create({ slipNumber: slipNumber(), patientId: previous.patientId, doctorId: previous.doctorId, appointmentId: previous.appointmentId, medicalRecordId: previous.medicalRecordId, tests: cleaned, status: previous.status, version: nextVersion, isCurrent: true });
    previous.isCurrent = false; previous.supersededAt = new Date(); previous.supersededBy = replacement._id; await previous.save();
    await writeAuditLog({ actorId: auth.user!.id, action: "test_slip_edited", resourceType: "TestSlip", resourceId: replacement._id, metadata: { previousSlipId: previous._id.toString(), version: nextVersion } });
    return NextResponse.json({ message: "Test slip updated. The newest version is now active.", slip: replacement });
  } catch (error) { console.error(error); return NextResponse.json({ message: "Unable to update the test slip." }, { status: 500 }); }
}
