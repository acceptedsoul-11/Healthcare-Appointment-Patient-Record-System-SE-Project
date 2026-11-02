import { requireRole } from "@/lib/require-role";
import DoctorWorkspace from "@/components/DoctorWorkspace";
import RoleSidebar from "@/components/RoleSidebar";
export default async function DoctorPage() { const user = await requireRole(["doctor"]); return <div className="min-h-screen bg-[#F1F6FA] lg:flex"><RoleSidebar role="doctor" /><div className="min-w-0 flex-1"><DoctorWorkspace name={user.fullName} email={user.email} /></div></div>; }
