import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";

export async function GET(request: NextRequest) { const auth = await requireApiUser(["administrator"]); if (auth.response) return auth.response; await connectDB(); const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 100, 200); const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit).populate({ path: "actorId", select: "fullName email role" }).lean(); return NextResponse.json({ logs }); }
