import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/models/User";

export async function requireApiUser(roles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: NextResponse.json({ message: "Authentication required." }, { status: 401 }) };
  if (roles && !roles.includes(user.role as UserRole)) {
    return { user: null, response: NextResponse.json({ message: "You are not authorized to perform this action." }, { status: 403 }) };
  }
  return { user, response: null };
}
