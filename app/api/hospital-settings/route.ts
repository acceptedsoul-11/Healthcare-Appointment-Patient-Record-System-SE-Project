import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import HospitalSetting from "@/models/HospitalSetting";

const defaults = {
  hospitalName: "CureWell Multispecialty Hospital",
  hospitalAddress: "CureWell Hospital Campus, Main Road, Bengaluru",
  hospitalPhone: "+91 80 0000 0000",
  hospitalEmail: "contact@curewell.local",
};

export async function GET() {
  const auth = await requireApiUser(["patient", "doctor", "receptionist", "administrator"]);
  if (auth.response) return auth.response;
  await connectDB();
  const values = Object.fromEntries((await HospitalSetting.find({ key: { $in: Object.keys(defaults) } }).lean()).map((item) => [item.key, item.value]));
  return NextResponse.json({ settings: { ...defaults, ...values } });
}
