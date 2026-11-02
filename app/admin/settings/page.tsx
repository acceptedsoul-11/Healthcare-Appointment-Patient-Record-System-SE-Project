import { requireRole } from "@/lib/require-role";
import AdminSettingsManager from "@/components/AdminSettingsManager";
import RoleSidebar from "@/components/RoleSidebar";
export default async function AdminSettingsPage() { await requireRole(["administrator"]); return <div className="min-h-screen bg-[#F1F6FA] lg:flex"><RoleSidebar role="administrator" /><div className="min-w-0 flex-1"><AdminSettingsManager /></div></div>; }
