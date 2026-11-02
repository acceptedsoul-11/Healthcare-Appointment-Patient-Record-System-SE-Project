import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Bill from "@/models/Bill";
import User from "@/models/User";

export async function GET() { const auth = await requireApiUser(["administrator"]); if (auth.response) return auth.response; await connectDB(); const [patients, doctors, staff, appointments, bills, revenue, completed, cancelled] = await Promise.all([User.countDocuments({ role: "patient" }), User.countDocuments({ role: "doctor", accountStatus: "approved" }), User.countDocuments({ role: { $in: ["receptionist", "administrator"] } }), Appointment.countDocuments(), Bill.countDocuments(), Bill.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, value: { $sum: "$total" } } }]), Appointment.countDocuments({ status: "completed" }), Appointment.countDocuments({ status: "cancelled" })]); return NextResponse.json({ stats: { patients, doctors, staff, appointments, bills, paidRevenue: revenue[0]?.value || 0, completedAppointments: completed, cancelledAppointments: cancelled } }); }
