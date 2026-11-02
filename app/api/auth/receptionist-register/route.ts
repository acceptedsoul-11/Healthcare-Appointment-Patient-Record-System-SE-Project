import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) { try { const body = (await request.json()) as { fullName?: string; email?: string; password?: string }; const fullName = body.fullName?.trim() || ""; const email = body.email?.trim().toLowerCase() || ""; const password = body.password || ""; if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 72) return NextResponse.json({ message: "Enter a valid name, email and password of 8 to 72 characters." }, { status: 400 }); await connectDB(); await User.create({ fullName, email, passwordHash: await bcrypt.hash(password, 12), role: "receptionist", accountStatus: "pending", isActive: true }); return NextResponse.json({ message: "Receptionist application submitted for administrator approval." }, { status: 201 }); } catch (error) { if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 }); console.error(error); return NextResponse.json({ message: "Unable to submit receptionist application." }, { status: 500 }); } }
