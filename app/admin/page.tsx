
import { Suspense } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import { requireRole } from "@/lib/require-role";
import RoleSidebar from "@/components/RoleSidebar";

async function AdminContent() {
  const user = await requireRole(["administrator"]);

  return <div className="min-h-screen bg-[#F1F6FA] lg:flex"><RoleSidebar role="administrator" /><div className="min-w-0 flex-1"><AdminDashboard name={user.fullName} /></div></div>;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F1F6FA] p-8">
          <div className="mx-auto max-w-7xl animate-pulse space-y-4">
            <div className="h-8 w-56 rounded-lg bg-blue-100" />
            <div className="h-32 rounded-xl bg-white" />
            <div className="h-64 rounded-xl bg-white" />
          </div>
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
