import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function GET() { const auth = await requireApiUser(); if (auth.response) return auth.response; await connectDB(); const notifications = await Notification.find({ userId: auth.user!.id }).sort({ createdAt: -1 }).limit(100).lean(); return NextResponse.json({ notifications }); }
export async function PATCH(request: NextRequest) { const auth = await requireApiUser(); if (auth.response) return auth.response; const body = (await request.json()) as { notificationId?: string; markAll?: boolean }; await connectDB(); if (body.markAll) await Notification.updateMany({ userId: auth.user!.id, readAt: { $exists: false } }, { $set: { readAt: new Date() } }); else if (body.notificationId && mongoose.isValidObjectId(body.notificationId)) await Notification.updateOne({ _id: body.notificationId, userId: auth.user!.id }, { $set: { readAt: new Date() } }); else return NextResponse.json({ message: "A notification is required." }, { status: 400 }); return NextResponse.json({ message: "Notifications updated." }); }
