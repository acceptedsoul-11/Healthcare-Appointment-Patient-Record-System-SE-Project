import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { writeAuditLog } from "@/lib/audit";
import Appointment from "@/models/Appointment";

export async function POST(request: Request) {
  const auth = await requireApiUser(["receptionist"]);
  if (auth.response) return auth.response;
  try {
    const body = (await request.json()) as { appointmentId?: string };
    if (!body.appointmentId || !mongoose.isValidObjectId(body.appointmentId)) return NextResponse.json({ message: "A valid appointment is required." }, { status: 400 });
    await connectDB();
    const appointment = await Appointment.findOneAndUpdate(
      { _id: body.appointmentId, status: { $in: ["scheduled", "confirmed"] }, checkedInAt: { $exists: false } },
      { $set: { checkedInAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!appointment) return NextResponse.json({ message: "Only scheduled or confirmed appointments can be checked in, and each visit can be checked in once." }, { status: 409 });
    await writeAuditLog({ actorId: auth.user!.id, action: "appointment_checked_in", resourceType: "Appointment", resourceId: appointment._id });
    return NextResponse.json({ message: "Patient checked in successfully.", appointment: { id: appointment._id.toString(), checkedInAt: appointment.checkedInAt } });
  } catch (error) {
    console.error("POST /api/appointments/check-in failed:", error);
    return NextResponse.json({ message: "Unable to check in the patient." }, { status: 500 });
  }
}
