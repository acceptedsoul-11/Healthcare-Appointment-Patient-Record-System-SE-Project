import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { writeAuditLog } from "@/lib/audit";
import Specialization from "@/models/Specialization";

export async function GET() { const auth = await requireApiUser(["administrator"]); if (auth.response) return auth.response; await connectDB(); return NextResponse.json({ specializations: await Specialization.find({}).sort({ name: 1 }).lean() }); }
export async function POST(request: NextRequest) { const auth = await requireApiUser(["administrator"]); if (auth.response) return auth.response; const body = (await request.json()) as { name?: string }; const name = body.name?.trim() || ""; if (name.length < 2 || name.length > 100) return NextResponse.json({ message: "Enter a valid specialization." }, { status: 400 }); await connectDB(); try { const item = await Specialization.create({ name }); await writeAuditLog({ actorId: auth.user!.id, action: "specialization_created", resourceType: "Specialization", resourceId: item._id }); return NextResponse.json({ message: "Specialization added.", specialization: item }, { status: 201 }); } catch (error) { if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ message: "That specialization already exists." }, { status: 409 }); return NextResponse.json({ message: "Unable to add specialization." }, { status: 500 }); } }
