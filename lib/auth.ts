
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import {
  COOKIE_NAME,
  verifySessionToken,
} from "@/lib/session";

export async function getCurrentUser(token?: string | null) {
  let sessionToken = token;

  // When no token argument is supplied, read the session
  // from the cookies of the current server request.
  if (sessionToken === undefined) {
    const cookieStore = await cookies();
    sessionToken = cookieStore.get(COOKIE_NAME)?.value ?? null;
  }

  if (!sessionToken) {
    return null;
  }

  const session = await verifySessionToken(sessionToken);

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
