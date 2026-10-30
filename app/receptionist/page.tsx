
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireRole } from "@/lib/require-role";

export const metadata: Metadata = {
  title: "Receptionist Dashboard",
};

const workspaces = [
  {
    number: "01",
    title: "Patient Registration",
    description:
      "Assist patients with registration and verify their basic details.",
    status: "Coming next",
  },
  {
    number: "02",
    title: "Appointment Management",
    description:
      "Coordinate bookings, rescheduling requests and cancellations.",
    status: "Coming next",
  },
  {
    number: "03",
    title: "Doctor Availability",
    description:
      "Review doctor schedules to help patients find suitable appointments.",
    status: "Coming next",
  },
  {
    number: "04",
    title: "Patient Directory",
    description:
      "Find patient profiles needed for authorized reception workflows.",
    status: "Coming next",
  },
];

async function ReceptionistContent() {
  const user = await requireRole(["receptionist"]);

  return (
    <main className="cw-page">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-blue-700"
          >
            CureWell
            <span className="ml-2 text-sm font-normal text-slate-500">
              Reception Portal
            </span>
          </Link>

          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
            Receptionist
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <section className="cw-hero rounded-3xl p-8 sm:p-10">
          <p className="text-sm font-medium text-blue-700">
            FRONT DESK WORKSPACE
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Welcome, {user.fullName}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Coordinate patient visits, support registration and help the
            hospital run smoothly from one organized workspace.
          </p>
        </section>

        <section className="mt-9">
          <h2 className="text-xl font-bold text-slate-900">
            Reception operations
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tools for daily front desk responsibilities.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {workspaces.map((item) => (
              <article
                key={item.number}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-xs font-bold tracking-widest text-blue-700">
                  {item.number}
                </span>

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                <span className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {item.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          These are dashboard placeholders. Patient registration,
          appointment coordination and directory searches will need to be
          connected to the appropriate backend APIs before they can modify or
          retrieve real records.
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500">
          Signed in as {user.email}
        </footer>
      </div>
    </main>
  );
}

export default function ReceptionistDashboard() {
  return (
    <Suspense
      fallback={
        <main className="cw-page min-h-screen p-8">
          <div className="mx-auto max-w-7xl animate-pulse space-y-5">
            <div className="h-10 w-64 rounded-lg bg-blue-100" />
            <div className="h-48 rounded-3xl bg-white" />
            <div className="h-64 rounded-2xl bg-white" />
          </div>
        </main>
      }
    >
      <ReceptionistContent />
    </Suspense>
  );
}
