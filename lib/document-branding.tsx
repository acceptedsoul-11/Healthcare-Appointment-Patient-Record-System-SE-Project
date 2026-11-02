"use client";

import { useEffect, useState } from "react";

export const documentFooter = "Built by:PES1UGAM240,PES1UG24AM251,PES1UG24AM252,PES1UG24AM293";

export type HospitalDetails = {
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
};

export const defaultHospitalDetails: HospitalDetails = {
  hospitalName: "CureWell Multispecialty Hospital",
  hospitalAddress: "CureWell Hospital Campus, Main Road, Bengaluru",
  hospitalPhone: "+91 80 0000 0000",
  hospitalEmail: "contact@curewell.local",
};

function useHospitalDetails() {
  const [details, setDetails] = useState(defaultHospitalDetails);
  useEffect(() => {
    let active = true;
    void fetch("/api/hospital-settings", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (active && data?.settings) setDetails({ ...defaultHospitalDetails, ...data.settings }); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  return details;
}

export function escapeDocumentText(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

export function DocumentHeader({ title }: { title: string }) {
  const details = useHospitalDetails();
  return (
    <header className="document-header document-page relative border-b-2 border-blue-700 pb-4">
      <div className="document-watermark" aria-hidden="true">CUREWELL</div>
      <div className="relative z-10 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-2xl font-extrabold text-white">+</span>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{details.hospitalName}</h1>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Care for a Healthier Tomorrow</p>
          <p className="mt-1 text-xs text-slate-600">{details.hospitalAddress} · {details.hospitalPhone} · {details.hospitalEmail}</p>
        </div>
      </div>
      <h2 className="relative z-10 mt-4 text-lg font-bold text-slate-900">{title}</h2>
    </header>
  );
}

export function DocumentFooter() {
  const details = useHospitalDetails();
  return <footer className="document-footer mt-8 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500"><p>{details.hospitalName} · {details.hospitalPhone} · {details.hospitalEmail}</p><p>{documentFooter}</p></footer>;
}

export async function printHospitalDocument(title: string, bodyHtml: string) {
  const popup = window.open("", "_blank", "width=900,height=1000");
  if (!popup) return;
  let details = defaultHospitalDetails;
  try {
    const response = await fetch("/api/hospital-settings", { cache: "no-store" });
    const data = await response.json();
    if (response.ok && data.settings) details = { ...details, ...data.settings };
  } catch { /* Use safe defaults when the settings endpoint is temporarily unavailable. */ }
  popup.document.write(`<!doctype html><html><head><title>${escapeDocumentText(title)}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#111827}.document{position:relative;max-width:820px;margin:auto}.watermark{position:fixed;inset:40% 0 auto;text-align:center;font-size:72px;font-weight:800;letter-spacing:12px;color:rgba(29,78,216,.07);transform:rotate(-25deg);pointer-events:none}.brand{position:relative;z-index:1;display:flex;gap:12px;align-items:center;border-bottom:2px solid #1d4ed8;padding-bottom:16px}.mark{background:#1d4ed8;color:white;border-radius:10px;padding:10px 15px;font-size:24px;font-weight:800}.contact{font-size:11px;color:#475569;margin-top:4px}.content{position:relative;z-index:1}.content table{width:100%;border-collapse:collapse;margin-top:24px}.content td,.content th{border-bottom:1px solid #ddd;padding:10px;text-align:left}.content footer{margin-top:60px;border-top:1px solid #ddd;padding-top:10px;text-align:center;color:#64748b;font-size:10px}@media print{body{padding:0}}</style></head><body><main class="document"><div class="watermark">CUREWELL</div><header class="brand"><div class="mark">+</div><div><h1>${escapeDocumentText(details.hospitalName)}</h1><div>Care for a Healthier Tomorrow</div><div class="contact">${escapeDocumentText(details.hospitalAddress)} · ${escapeDocumentText(details.hospitalPhone)} · ${escapeDocumentText(details.hospitalEmail)}</div></div></header><section class="content"><h2>${escapeDocumentText(title)}</h2>${bodyHtml}<footer>${escapeDocumentText(details.hospitalName)} · ${escapeDocumentText(details.hospitalPhone)} · ${escapeDocumentText(details.hospitalEmail)}<br>${documentFooter}</footer></section></main></body></html>`);
  popup.document.close();
  window.setTimeout(() => { popup.focus(); popup.print(); }, 250);
}
