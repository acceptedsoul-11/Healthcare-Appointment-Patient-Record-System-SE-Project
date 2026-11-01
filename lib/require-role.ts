
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export type AppRole =
  | "patient"
  | "doctor"
  | "receptionist"
  | "administrator";

const roleHome: Record<AppRole, string> = {
  patient: "/",
  doctor: "/doctor",
  receptionist: "/receptionist",
  administrator: "/admin",
};

export async function requireRole(allowedRoles: AppRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role as AppRole)) {
    const destination = roleHome[user.role as AppRole];

    redirect(destination ?? "/login");
  }

  if (user.role === "doctor" && user.accountStatus !== "approved") {
    redirect(`/doctor/register?status=${user.accountStatus}`);
  }

  return user;
}
