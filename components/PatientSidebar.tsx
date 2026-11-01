
"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import CureWellLogo from "./CureWellLogo";

const navigation = [
  { name: "Dashboard", href: "/", icon: "⌂" },
  { name: "Appointments", href: "/appointments", icon: "▦" },
  { name: "Find Doctors", href: "/find-doctors", icon: "✚" },
  { name: "Medical Records", href: "/records", icon: "▤" },
  { name: "My Profile", href: "/profile", icon: "♙" },
  { name: "Settings", href: "/settings", icon: "⚙" },
];

type PatientSidebarProps = {
  onBookAppointment?: () => void;
};

export default function PatientSidebar({
  onBookAppointment,
}: PatientSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="patient-sidebar"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-white text-xl text-blue-700 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100 lg:hidden"
      >
        ☰
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        id="patient-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <CureWellLogo />

            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={closeMobileMenu}
              className="rounded-lg px-2 py-1 text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 lg:hidden"
            >
              ×
            </button>
          </div>

          <p className="mt-3 pl-1 text-xs text-slate-500">
            Care for a Healthier Tomorrow
          </p>
        </div>

        {/* Navigation */}
        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Patient Menu
          </p>

          <nav aria-label="Patient navigation" className="space-y-1.5">
            {navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-800"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg transition ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-slate-50 text-slate-600 group-hover:bg-white group-hover:text-blue-700"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="flex-1">{item.name}</span>

                  {active && (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-white"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Appointment call to action */}
        <div className="mt-auto p-4">
          <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 p-4 text-slate-900 shadow-sm">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full border-[16px] border-white/10"
            />

            <div className="relative">
              <span
                aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl text-blue-700"
              >
                ✚
              </span>

              <p className="mt-4 text-sm font-bold">
                Your health comes first.
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Take the next step toward better health with our medical team.
              </p>

              {onBookAppointment && (
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    onBookAppointment();
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  Book an appointment
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] font-semibold text-slate-500">
              CureWell Multispecialty Hospital
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Care for a Healthier Tomorrow
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
