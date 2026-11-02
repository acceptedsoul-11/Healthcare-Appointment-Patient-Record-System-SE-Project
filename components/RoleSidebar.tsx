"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CureWellLogo from "./CureWellLogo";
import LogoutButton from "./LogoutButton";

type Role = "doctor" | "receptionist" | "administrator";

const navigation: Record<Role, { name: string; href: string; icon: string }[]> = {
  doctor: [
    { name: "Doctor dashboard", href: "/doctor", icon: "⌂" },
  ],
  receptionist: [
    { name: "Reception dashboard", href: "/receptionist", icon: "⌂" },
    { name: "Prescriptions", href: "/receptionist/prescriptions", icon: "▤" },
    { name: "Test slips", href: "/receptionist/test-slips", icon: "✚" },
    { name: "Bills", href: "/receptionist/bills", icon: "₹" },
  ],
  administrator: [
    { name: "Admin dashboard", href: "/admin", icon: "⌂" },
    { name: "Account approvals", href: "/admin/accounts", icon: "✓" },
    { name: "Staff management", href: "/admin/staff", icon: "♙" },
    { name: "Specializations", href: "/admin/specializations", icon: "✚" },
    { name: "Hospital settings", href: "/admin/settings", icon: "⚙" },
  ],
};

export default function RoleSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navigation[role];

  function isActive(href: string) {
    if (["/doctor", "/receptionist", "/admin"].includes(href)) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <button type="button" aria-label="Open navigation menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className="fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-white text-xl text-blue-700 shadow-sm lg:hidden">☰</button>
      {mobileOpen && <button type="button" aria-label="Close navigation overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="border-b border-slate-100 px-5 py-5"><div className="flex items-center justify-between gap-3"><CureWellLogo /><button type="button" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-1 text-xl text-slate-400 lg:hidden">×</button></div><p className="mt-3 pl-1 text-xs text-slate-500">CureWell Multispecialty Hospital</p></div>
        <div className="px-4 pt-7"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{role === "administrator" ? "Administration" : role === "doctor" ? "Doctor menu" : "Reception menu"}</p><nav aria-label={`${role} navigation`} className="space-y-1.5">{items.map((item) => { const active = isActive(item.href); return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-blue-50 hover:text-blue-800"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${active ? "bg-white/15 text-white" : "bg-slate-50 text-slate-600 group-hover:bg-white group-hover:text-blue-700"}`}>{item.icon}</span><span className="flex-1">{item.name}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</Link>; })}</nav></div>
        <div className="mt-auto p-4"><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-sm font-bold text-slate-900">Secure CureWell workspace</p><p className="mt-2 text-xs leading-5 text-slate-600">Use the menu to move between your role-specific tools.</p></div><div className="mt-5 border-t border-slate-100 pt-4"><LogoutButton className="w-full rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50" /></div></div>
      </aside>
    </>
  );
}
