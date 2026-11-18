import { requireRole } from "@/lib/require-role";
import AppointmentWorkspace from "./AppointmentWorkspace";

export default async function AppointmentsPage() {
  await requireRole(["patient"]);
  return <AppointmentWorkspace />;
}
