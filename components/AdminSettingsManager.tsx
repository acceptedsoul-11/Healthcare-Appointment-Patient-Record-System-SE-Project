"use client";

import { useEffect, useState } from "react";

const defaults = { hospitalName: "CureWell Multispecialty Hospital", hospitalAddress: "CureWell Hospital Campus, Main Road, Bengaluru", hospitalPhone: "+91 80 0000 0000", hospitalEmail: "contact@curewell.local", taxRate: "0", appointmentDuration: "30" };

export default function AdminSettingsManager() {
  const [settings, setSettings] = useState(defaults);
  const [message, setMessage] = useState("");
  useEffect(() => { void fetch("/api/admin/settings", { cache: "no-store" }).then((response) => response.json()).then((data) => setSettings((current) => ({ ...current, ...(data.settings || {}) }))); }, []);
  async function save() { const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }); const data = await response.json(); setMessage(data.message); }
  return <main className="cw-page min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-5xl"><header className="cw-hero rounded-3xl p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">CureWell administration</p><h1 className="mt-3 text-3xl font-extrabold text-slate-900">Hospital settings</h1><p className="mt-2 text-sm text-slate-600">These identity details appear on prescriptions, bills, test slips and appointment documents.</p></header>{message && <p className="mt-5 rounded-xl bg-teal-50 p-4 text-sm text-teal-800">{message}</p>}<section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-3 sm:grid-cols-2">{Object.entries(settings).map(([key, value]) => <label key={key} className="text-sm font-semibold capitalize text-slate-800">{key.replace(/([A-Z])/g, " $1")}<input value={value} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>)}</div><button onClick={() => void save()} className="cw-primary mt-5 rounded-xl px-4 py-3 text-sm font-bold">Save settings</button></section></div></main>;
}
