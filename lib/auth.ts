
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import {
  COOKIE_NAME,
  verifySessionToken,
} from "@/lib/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  await connectDB();

  const user = await User.findOne({
    _id: session.userId,
    isActive: true,
  }).select("_id fullName email role accountStatus");

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus || "approved",
  };
}
