import { requireRole } from "@/lib/require-role";
import ReceptionBills from "@/components/ReceptionBills";
import RoleSidebar from "@/components/RoleSidebar";
export default async function ReceptionBillsPage() { await requireRole(["receptionist"]); return <div className="min-h-screen bg-[#F1F6FA] lg:flex"><RoleSidebar role="receptionist" /><div className="min-w-0 flex-1"><ReceptionBills /></div></div>; }
