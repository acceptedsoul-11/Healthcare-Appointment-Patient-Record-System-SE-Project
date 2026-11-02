import { requireRole } from "@/lib/require-role";
import ReceptionPrescriptions from "@/components/ReceptionPrescriptions";
import RoleSidebar from "@/components/RoleSidebar";
export default async function ReceptionPrescriptionsPage() { await requireRole(["receptionist"]); return <div className="min-h-screen bg-[#F1F6FA] lg:flex"><RoleSidebar role="receptionist" /><div className="min-w-0 flex-1"><ReceptionPrescriptions /></div></div>; }
