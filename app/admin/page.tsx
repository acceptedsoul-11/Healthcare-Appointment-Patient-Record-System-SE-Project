import AdminDashboard from "@/components/AdminDashboard";
import { requireRole } from "@/lib/require-role";

export default async function AdminPage() {
  const user = await requireRole(["administrator"]);
  return <AdminDashboard name={user.fullName} />;
}
