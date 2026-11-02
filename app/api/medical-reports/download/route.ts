import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import MedicalReport from "@/models/MedicalReport";
import Patient from "@/models/Patient";

export async function GET(request: NextRequest) { const auth = await requireApiUser(["patient", "doctor"]); if (auth.response) return auth.response; const id = request.nextUrl.searchParams.get("id") || ""; if (!mongoose.isValidObjectId(id)) return NextResponse.json({ message: "Invalid report." }, { status: 400 }); try { await connectDB(); const report = await MedicalReport.findById(id); if (!report) return NextResponse.json({ message: "Report not found." }, { status: 404 }); let allowed = false; if (auth.user!.role === "patient") { const patient = await Patient.findOne({ userId: auth.user!.id }).select("_id"); allowed = patient?._id.toString() === report.patientId.toString(); } else { const doctor = await Doctor.findOne({ userId: auth.user!.id }).select("_id"); allowed = !!doctor && !!(await Appointment.exists({ doctorId: doctor._id, patientId: report.patientId })); } if (!allowed) return NextResponse.json({ message: "You are not authorized to view this report." }, { status: 403 }); const storageRoot = path.join(process.cwd(), process.env.PRIVATE_UPLOAD_DIR || ".private-uploads"); const data = await readFile(path.join(storageRoot, report.storageKey)); return new NextResponse(data, { headers: { "Content-Type": report.mimeType, "Content-Disposition": `attachment; filename="${report.fileName.replace(/"/g, "")}"`, "Cache-Control": "private, no-store" } }); } catch (error) { console.error(error); return NextResponse.json({ message: "Unable to download the report." }, { status: 500 }); } }
