import { requireRole } from "@/lib/require-role";
import ReceptionWorkspace from "@/components/ReceptionWorkspace";
import RoleSidebar from "@/components/RoleSidebar";
export default async function ReceptionistPage() { const user = await requireRole(["receptionist"]); return <div className="min-h-screen bg-[#F1F6FA] lg:flex"><RoleSidebar role="receptionist" /><div className="min-w-0 flex-1"><ReceptionWorkspace name={user.fullName} /></div></div>; }
