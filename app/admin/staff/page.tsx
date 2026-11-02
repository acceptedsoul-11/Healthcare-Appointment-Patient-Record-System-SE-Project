import { requireRole } from "@/lib/require-role";
import AdminStaffManager from "@/components/AdminStaffManager";
import RoleSidebar from "@/components/RoleSidebar";
export default async function AdminStaffPage() { await requireRole(["administrator"]); return <div className="min-h-screen bg-[#F1F6FA] lg:flex"><RoleSidebar role="administrator" /><div className="min-w-0 flex-1"><AdminStaffManager /></div></div>; }
