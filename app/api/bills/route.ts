import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";
import Appointment from "@/models/Appointment";
import Bill, { PaymentMethod } from "@/models/Bill";
import Patient from "@/models/Patient";

function billNumber() { return `CW-B-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`; }

export async function GET() {
  const auth = await requireApiUser(["patient", "receptionist", "administrator"]);
  if (auth.response) return auth.response;
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (auth.user!.role === "patient") { const patient = await Patient.findOne({ userId: auth.user!.id }).select("_id"); filter.patientId = patient?._id; }
  const bills = await Bill.find(filter).sort({ createdAt: -1 }).populate({ path: "patientId", populate: { path: "userId", select: "fullName email" } }).populate({ path: "createdBy", select: "fullName email" }).lean();
  return NextResponse.json({ bills });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(["receptionist"]);
  if (auth.response) return auth.response;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const patientId = typeof body.patientId === "string" ? body.patientId : "";
    const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : "";
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!mongoose.isValidObjectId(patientId) || !rawItems.length) return NextResponse.json({ message: "A patient and at least one charge are required." }, { status: 400 });
    const paymentMethod: PaymentMethod = typeof body.paymentMethod === "string" && ["cash", "card", "upi", "insurance", "other"].includes(body.paymentMethod) ? body.paymentMethod as PaymentMethod : "cash";
    if (!appointmentId) return NextResponse.json({ message: "Select a checked-in appointment before generating a bill." }, { status: 400 });
    const items = rawItems.slice(0, 50).map((item) => item as Record<string, unknown>).map((item) => { const quantity = typeof item.quantity === "number" ? item.quantity : Number(item.quantity); const unitPrice = typeof item.unitPrice === "number" ? item.unitPrice : Number(item.unitPrice); return { category: typeof item.category === "string" ? item.category.trim().slice(0, 80) : "Other", description: typeof item.description === "string" ? item.description.trim().slice(0, 200) : "Charge", quantity, unitPrice, total: Math.round(quantity * unitPrice * 100) / 100 }; }).filter((item) => item.description && Number.isFinite(item.quantity) && item.quantity > 0 && Number.isFinite(item.unitPrice) && item.unitPrice >= 0);
    if (!items.length) return NextResponse.json({ message: "Enter valid billing items." }, { status: 400 });
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
    const discount = Math.max(0, Number(body.discount) || 0); const tax = Math.max(0, Number(body.tax) || 0); const total = Math.max(0, Math.round((subtotal - discount + tax) * 100) / 100);
    await connectDB();
    if (!(await Patient.exists({ _id: patientId }))) return NextResponse.json({ message: "Patient not found." }, { status: 404 });
    if (appointmentId) {
      if (!mongoose.isValidObjectId(appointmentId)) return NextResponse.json({ message: "The appointment reference is invalid." }, { status: 400 });
      const checkedInAppointment = await Appointment.exists({ _id: appointmentId, patientId, checkedInAt: { $exists: true } });
      if (!checkedInAppointment) return NextResponse.json({ message: "A bill can only be linked to a checked-in appointment for this patient." }, { status: 409 });
      const existingBill = await Bill.findOne({ appointmentId }).select("billNumber paymentStatus").lean();
      if (existingBill) return NextResponse.json({ message: `A bill already exists for this appointment: ${existingBill.billNumber}. Each appointment has its own bill.` }, { status: 409 });
    }
    const bill = await Bill.create({ billNumber: billNumber(), patientId, appointmentId, createdBy: auth.user!.id, items, subtotal, discount, tax, total, paymentStatus: "unpaid", paymentMethod, paidAmount: 0, notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : undefined });
    const patient = await Patient.findById(patientId).select("userId");
    if (patient) await createNotification({ userId: patient.userId, type: "bill", title: "New hospital bill available", message: `Bill ${bill.billNumber} has been generated.`, resourceType: "Bill", resourceId: bill._id });
    await writeAuditLog({ actorId: auth.user!.id, action: "bill_created", resourceType: "Bill", resourceId: bill._id, metadata: { total, appointmentId, paymentMethod } });
    return NextResponse.json({ message: "Bill generated successfully.", bill }, { status: 201 });
  } catch (error) { if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) return NextResponse.json({ message: "A bill already exists for this appointment." }, { status: 409 }); console.error(error); return NextResponse.json({ message: "Unable to generate the bill." }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(["receptionist"]);
  if (auth.response) return auth.response;
  try {
    const body = (await request.json()) as { billId?: string; paymentStatus?: string; paidAmount?: number };
    if (!body.billId || !mongoose.isValidObjectId(body.billId) || !["unpaid", "partially_paid", "paid", "waived"].includes(body.paymentStatus || "")) return NextResponse.json({ message: "A valid bill and payment status are required." }, { status: 400 });
    await connectDB();
    const existingBill = await Bill.findById(body.billId).select("paymentStatus");
    if (!existingBill) return NextResponse.json({ message: "Bill not found." }, { status: 404 });
    if (existingBill.paymentStatus === "paid") return NextResponse.json({ message: "This bill is paid and locked; its payment status cannot be changed." }, { status: 409 });
    const bill = await Bill.findByIdAndUpdate(body.billId, { $set: { paymentStatus: body.paymentStatus, paidAmount: Math.max(0, Number(body.paidAmount) || 0) } }, { returnDocument: "after", runValidators: true });
    if (!bill) return NextResponse.json({ message: "Bill not found." }, { status: 404 });
    await writeAuditLog({ actorId: auth.user!.id, action: "bill_payment_updated", resourceType: "Bill", resourceId: bill._id, metadata: { paymentStatus: body.paymentStatus } });
    return NextResponse.json({ message: "Payment status updated.", bill });
  } catch (error) { console.error(error); return NextResponse.json({ message: "Unable to update payment status." }, { status: 500 }); }
}
