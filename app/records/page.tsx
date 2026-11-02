"use client";

import { useEffect, useState } from "react";
import PatientSidebar from "@/components/PatientSidebar";
import { escapeDocumentText, printHospitalDocument } from "@/lib/document-branding";

type Prescription = { medication: string; dosage: string; route?: string; frequency: string; timing?: string; duration?: string; quantity?: string; instructions?: string };
type RecordItem = { id: string; diagnosis: string; treatmentNotes?: string; doctorName: string; visitDate: string; prescriptions: Prescription[]; followUpDate?: string | null };
type Report = { id: string; fileName: string; createdAt: string; downloadUrl: string };
type Slip = { _id: string; slipNumber: string; issuedAt: string; status: string; tests: { name: string; instructions?: string }[] };

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const [recordsResponse, reportsResponse, slipsResponse] = await Promise.all([
      fetch("/api/records", { cache: "no-store" }),
      fetch("/api/medical-reports", { cache: "no-store" }),
      fetch("/api/test-slips", { cache: "no-store" }),
    ]);
    const [recordsData, reportsData, slipsData] = await Promise.all([recordsResponse.json(), reportsResponse.json(), slipsResponse.json()]);
    if (!recordsResponse.ok) throw new Error(recordsData.message);
    if (!reportsResponse.ok) throw new Error(reportsData.message);
    if (!slipsResponse.ok) throw new Error(slipsData.message);
    setRecords(recordsData.records || []);
    setReports(reportsData.reports || []);
    setSlips(slipsData.slips || []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load records.")); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function printPrescription(record: RecordItem) {
    const rows = record.prescriptions.map((item) => `<tr><td>${escapeDocumentText(item.medication)}</td><td>${escapeDocumentText(item.dosage)}</td><td>${escapeDocumentText(item.route || "-")}</td><td>${escapeDocumentText(item.frequency)}</td><td>${escapeDocumentText(item.timing || "-")}</td><td>${escapeDocumentText(item.duration || "-")}</td><td>${escapeDocumentText(item.quantity || "-")}</td><td>${escapeDocumentText(item.instructions || "-")}</td></tr>`).join("");
    void printHospitalDocument("Prescription", `<p>Diagnosis: <strong>${escapeDocumentText(record.diagnosis)}</strong></p><p>Patient medical record · Dr. ${escapeDocumentText(record.doctorName)} · ${escapeDocumentText(new Date(record.visitDate).toLocaleDateString("en-IN"))}</p><table><thead><tr><th>Medicine</th><th>Dosage</th><th>Route</th><th>Frequency</th><th>Timing</th><th>Duration</th><th>Quantity</th><th>Instructions</th></tr></thead><tbody>${rows}</tbody></table>${record.treatmentNotes ? `<p><strong>Treatment notes:</strong> ${escapeDocumentText(record.treatmentNotes)}</p>` : ""}`);
  }

  function printSlip(slip: Slip) {
    const rows = slip.tests.map((test) => `<tr><td>${escapeDocumentText(test.name)}</td><td>${escapeDocumentText(test.instructions || "-")}</td></tr>`).join("");
    void printHospitalDocument("Additional Test Slip", `<p>Slip number: <strong>${escapeDocumentText(slip.slipNumber)}</strong></p><p>Issued: ${escapeDocumentText(new Date(slip.issuedAt).toLocaleDateString("en-IN"))}</p><table><thead><tr><th>Investigation</th><th>Instructions</th></tr></thead><tbody>${rows}</tbody></table>`);
  }

  return (
    <main className="cw-page lg:flex">
      <PatientSidebar />
      <div className="min-w-0 flex-1 px-5 pb-12 pt-20 sm:px-8 lg:px-10 lg:pt-10">
        <header className="cw-hero mx-auto max-w-5xl rounded-3xl p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Secure patient portal</p><h1 className="mt-2 text-3xl font-extrabold text-slate-900">Medical records</h1><p className="mt-2 text-sm text-slate-500">Consultations, prescriptions, test slips and hospital-issued reports.</p></header>
        {error && <p role="alert" className="mx-auto mt-5 max-w-5xl rounded-xl p-4 text-sm text-rose-800 bg-rose-50">{error}</p>}
        <section className="mx-auto mt-7 max-w-5xl space-y-4">{records.map((record) => <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Visit record</p><h2 className="mt-1 text-xl font-extrabold text-slate-900">{record.diagnosis}</h2><p className="mt-2 text-sm text-slate-500">Dr. {record.doctorName} · {new Date(record.visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>{record.treatmentNotes && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{record.treatmentNotes}</p>}{record.prescriptions.length > 0 && <div className="mt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-900">Prescription</h3><button type="button" onClick={() => printPrescription(record)} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">Download / print prescription</button></div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><th className="py-2">Medicine</th><th className="py-2">Dosage</th><th className="py-2">Route</th><th className="py-2">Frequency</th><th className="py-2">Timing</th><th className="py-2">Duration</th><th className="py-2">Qty</th><th className="py-2">Instructions</th></tr></thead><tbody>{record.prescriptions.map((item, index) => <tr key={`${item.medication}-${index}`} className="border-b border-slate-100"><td className="py-3 font-semibold">{item.medication}</td><td className="py-3">{item.dosage}</td><td className="py-3">{item.route || "-"}</td><td className="py-3">{item.frequency}</td><td className="py-3">{item.timing || "-"}</td><td className="py-3">{item.duration || "-"}</td><td className="py-3">{item.quantity || "-"}</td><td className="py-3">{item.instructions || "-"}</td></tr>)}</tbody></table></div></div>}{record.followUpDate && <p className="mt-4 text-sm font-semibold text-indigo-700">Follow-up recommended: {new Date(record.followUpDate).toLocaleDateString("en-IN")}</p>}</article>)}{records.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No medical records yet.</p>}</section>
        <section className="mx-auto mt-8 max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold text-slate-900">Hospital reports</h2><p className="mt-1 text-sm text-slate-500">Reports are view-only. Uploading reports is disabled.</p>{reports.length ? <div className="mt-5 space-y-2">{reports.map((report) => <a key={report.id} href={report.downloadUrl} className="block rounded-xl border border-slate-100 p-3 text-sm text-blue-700 hover:bg-blue-50">{report.fileName} · {new Date(report.createdAt).toLocaleDateString("en-IN")}</a>)}</div> : <p className="mt-5 text-sm text-slate-500">No hospital reports available.</p>}</section>
        <section className="mx-auto mt-8 max-w-5xl space-y-4"><h2 className="text-xl font-extrabold text-slate-900">Additional test slips</h2>{slips.map((slip) => <article key={slip._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{slip.slipNumber}</p><h3 className="mt-1 font-bold text-slate-900">Test request</h3></div><button type="button" onClick={() => printSlip(slip)} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">Download / print slip</button></div><ul className="mt-4 list-disc pl-5 text-sm text-slate-700">{slip.tests.map((test, index) => <li key={index}>{test.name}{test.instructions ? ` — ${test.instructions}` : ""}</li>)}</ul><p className="mt-4 text-xs text-slate-500">Issued {new Date(slip.issuedAt).toLocaleDateString("en-IN")} · Status {slip.status}</p></article>)}</section>
      </div>
    </main>
  );
}
