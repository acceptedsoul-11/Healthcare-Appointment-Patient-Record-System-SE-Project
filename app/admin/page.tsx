
import { Suspense } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import { requireRole } from "@/lib/require-role";

async function AdminContent() {
  const user = await requireRole(["administrator"]);

  return <AdminDashboard name={user.fullName} />;
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
