import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { writeAuditLog } from "@/lib/audit";
import HospitalSetting from "@/models/HospitalSetting";

export async function GET() {
  const auth = await requireApiUser(["administrator"]);
  if (auth.response) return auth.response;
  await connectDB();
  const settings = await HospitalSetting.find({}).lean();
  return NextResponse.json({ settings: Object.fromEntries(settings.map((item) => [item.key, item.value])) });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(["administrator"]);
  if (auth.response) return auth.response;
  const body = (await request.json()) as Record<string, unknown>;
  const allowed = ["hospitalName", "hospitalAddress", "hospitalPhone", "hospitalEmail", "taxRate", "appointmentDuration"];
  const entries = Object.entries(body).filter(([key, value]) => allowed.includes(key) && typeof value === "string").map(([key, value]) => [key, String(value).trim().slice(0, 500)] as const);
  if (!entries.length) return NextResponse.json({ message: "No valid settings supplied." }, { status: 400 });
  await connectDB();
  await Promise.all(entries.map(([key, value]) => HospitalSetting.findOneAndUpdate({ key }, { $set: { value, updatedBy: auth.user!.id } }, { upsert: true, returnDocument: "after" })));
  await writeAuditLog({ actorId: auth.user!.id, action: "hospital_settings_updated", resourceType: "HospitalSetting", metadata: Object.fromEntries(entries) });
  return NextResponse.json({ message: "Hospital settings saved." });
}
