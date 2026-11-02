import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { writeAuditLog } from "@/lib/audit";
import User from "@/models/User";

export async function POST(request: NextRequest) { const auth = await requireApiUser(); if (auth.response) return auth.response; try { const body = (await request.json()) as { currentPassword?: string; newPassword?: string }; if (!body.currentPassword || !body.newPassword || body.newPassword.length < 8 || body.newPassword.length > 72) return NextResponse.json({ message: "Enter a current password and a new password of 8 to 72 characters." }, { status: 400 }); await connectDB(); const user = await User.findById(auth.user!.id).select("+passwordHash"); if (!user || !(await bcrypt.compare(body.currentPassword, user.passwordHash))) return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 }); user.passwordHash = await bcrypt.hash(body.newPassword, 12); await user.save(); await writeAuditLog({ actorId: auth.user!.id, action: "password_changed", resourceType: "User", resourceId: user._id }); return NextResponse.json({ message: "Password changed successfully." }); } catch (error) { console.error(error); return NextResponse.json({ message: "Unable to change password." }, { status: 500 }); } }
