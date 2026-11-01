
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireRole } from "@/lib/require-role";

export const metadata: Metadata = {
  title: "Doctor Dashboard",
};

const features = [
  {
    number: "01",
    title: "Appointments",
    description: "Review your scheduled patient visits.",
    status: "Workspace",
  },
  {
    number: "02",
    title: "Availability",
    description: "Prepare your working hours and appointment slots.",
    status: "Workspace",
  },
  {
    number: "03",
    title: "Patient Records",
    description: "Access authorized patient information for clinical care.",
    status: "Workspace",
  },
  {
    number: "04",
    title: "Prescriptions",
    description: "Prepare and review patient prescription information.",
    status: "Workspace",
  },
];

async function DoctorDashboardContent() {
  const user = await requireRole(["doctor"]);

  return (
    <main className="cw-page">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-blue-700">
            CureWell
            <span className="ml-2 text-sm font-normal text-slate-500">
              Doctor Portal
            </span>
          </Link>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
            Doctor
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="cw-hero rounded-3xl p-8 sm:p-10">
          <p className="text-sm font-medium text-blue-700">
            DOCTOR WORKSPACE
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Welcome, Dr. {user.fullName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Manage your clinical workflow, appointment schedule and authorized
            patient care information from one place.
          </p>
        </div>

        <div className="mt-9">
          <h2 className="text-xl font-bold text-slate-900">
            Your workspace
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Clinical tools for your daily work.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="text-xs font-bold tracking-widest text-blue-700">
                  {feature.number}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  {feature.description}
                </p>
                <span className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {feature.status}
                </span>
              </article>
            ))}
          </div>
        </div>

        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          These workspace cards are frontend placeholders. Appointment,
          availability, patient-record and prescription operations must be
          connected to authorized backend endpoints before they are functional.
        </p>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500">
          Signed in as {user.email}
        </footer>
      </div>
    </main>
  );
}

export default function DoctorDashboard() {
  return (
    <Suspense
      fallback={
        <main className="cw-page min-h-screen p-8">
          <div className="mx-auto max-w-7xl animate-pulse space-y-5">
            <div className="h-10 w-56 rounded-lg bg-blue-100" />
            <div className="h-48 rounded-3xl bg-white" />
            <div className="h-64 rounded-2xl bg-white" />
          </div>
        </main>
      }
    >
      <DoctorDashboardContent />
    </Suspense>
  );
}
