"use client";

import { useEffect, useState } from "react";
import { escapeDocumentText, printHospitalDocument } from "@/lib/document-branding";
import { doctorDisplayName } from "@/lib/display-names";

type Appointment = { id: string; appointmentDate: string; startTime: string; endTime: string; reason: string; status: string; patient?: { id?: string; name: string; email: string } | null };
type Availability = { dayOfWeek: number; startTime: string; endTime: string };
type Doctor = { specialization: string; qualification: string[]; consultationFee: number; experienceYears: number; phone?: string; bio?: string; availability: Availability[] };
type Medication = { medication: string; dosage: string; route: string; frequency: string; timing: string; duration: string; quantity: string; instructions: string };
type RecordItem = { id: string; version?: number; patientId?: string; patientName?: string; diagnosis: string; treatmentNotes?: string; visitDate: string; prescriptions: Medication[]; followUpDate?: string | null };
type TestSlip = { _id: string; version?: number; slipNumber: string; issuedAt: string; status: string; tests: { name: string; instructions?: string }[]; patientId?: { userId?: { fullName?: string } } };
type SearchPatient = { id: string; fullName: string; email: string; visited: boolean; appointmentCount: number };
type DocumentMode = "prescription" | "test" | null;

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const emptyMedication = (): Medication => ({ medication: "", dosage: "", route: "", frequency: "", timing: "", duration: "", quantity: "", instructions: "" });

export default function DoctorWorkspace({ name, email }: { name: string; email: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [slips, setSlips] = useState<TestSlip[]>([]);
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [mode, setMode] = useState<DocumentMode>(null);
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [editingSlip, setEditingSlip] = useState<TestSlip | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [searchPatients, setSearchPatients] = useState<SearchPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<Medication[]>([emptyMedication()]);
  const [followUpDate, setFollowUpDate] = useState("");
  const [testName, setTestName] = useState("");
  const [testInstructions, setTestInstructions] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingPrescription, setSavingPrescription] = useState(false);

  async function load() {
    const responses = await Promise.all([
      fetch("/api/appointments", { cache: "no-store" }),
      fetch("/api/records", { cache: "no-store" }),
      fetch("/api/doctor/profile", { cache: "no-store" }),
      fetch("/api/test-slips", { cache: "no-store" }),
    ]);
    const data = await Promise.all(responses.map((response) => response.json()));
    if (responses.some((response) => !response.ok)) throw new Error(data.find((item, index) => !responses[index].ok)?.message || "Unable to load doctor workspace.");
    setAppointments(data[0].appointments || []);
    setRecords(data[1].records || []);
    setProfile(data[2].doctor || null);
    setSlips(data[3].slips || []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load doctor workspace.")); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch(`/api/doctor/patients?q=${encodeURIComponent(patientSearch)}`, { cache: "no-store" }).then((response) => response.json()).then((data) => setSearchPatients(data.patients || [])).catch(() => setSearchPatients([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [patientSearch]);

  async function updateAppointment(id: string, action: string) {
    const response = await fetch("/api/appointments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appointmentId: id, action }) });
    const data = await response.json();
    if (!response.ok) return setError(data.message);
    setMessage(data.message);
    await load();
  }

  function openPrescription(appointment: Appointment) { setEditingRecord(null); setEditingSlip(null); setSelected(appointment); setMode("prescription"); setDiagnosis(""); setNotes(""); setMedications([emptyMedication()]); setFollowUpDate(""); setError(""); }
  function openEditPrescription(record: RecordItem) { setEditingRecord(record); setEditingSlip(null); setSelected(null); setMode("prescription"); setDiagnosis(record.diagnosis); setNotes(record.treatmentNotes || ""); setMedications(record.prescriptions.length ? record.prescriptions.map((item) => ({ ...emptyMedication(), ...item })) : [emptyMedication()]); setFollowUpDate(record.followUpDate ? record.followUpDate.slice(0, 10) : ""); setError(""); }
  function openTestSlip(appointment: Appointment) { setEditingRecord(null); setEditingSlip(null); setSelected(appointment); setMode("test"); setTestName(""); setTestInstructions(""); setError(""); }
  function openEditTestSlip(slip: TestSlip) { setEditingRecord(null); setEditingSlip(slip); setSelected(null); setMode("test"); setTestName(slip.tests[0]?.name || ""); setTestInstructions(slip.tests[0]?.instructions || ""); setError(""); }
  function closeDocument() { setSelected(null); setEditingRecord(null); setEditingSlip(null); setMode(null); }
  function updateMedication(index: number, key: keyof Medication, value: string) { setMedications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)); }

  async function savePrescription() {
    if (savingPrescription) return;
    if (!diagnosis.trim()) return setError("Enter a diagnosis before issuing the prescription.");
    const valid = medications.filter((item) => item.medication.trim());
    if (!valid.length) return setError("Add at least one medicine.");
    if (valid.some((item) => !item.dosage.trim() || !item.frequency.trim())) return setError("Every medicine needs a dosage and frequency.");
    setSavingPrescription(true);
    setError("");
    try {
      const body = { diagnosis, treatmentNotes: notes, followUpDate, prescriptions: valid, ...(editingRecord ? { recordId: editingRecord.id } : { appointmentId: selected?.id }) };
      const response = await fetch("/api/records", { method: editingRecord ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save the prescription.");
      setMessage(data.message || "Prescription saved.");
      closeDocument();
      await load();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to save the prescription.");
    } finally {
      setSavingPrescription(false);
    }
  }

  async function issueTestSlip() {
    if (!testName.trim()) return setError("Enter at least one test name.");
    const body = editingSlip ? { slipId: editingSlip._id, tests: [{ name: testName, instructions: testInstructions }] } : { appointmentId: selected?.id, tests: [{ name: testName, instructions: testInstructions }] };
    const response = await fetch("/api/test-slips", { method: editingSlip ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) return setError(data.message);
    setMessage(data.message || "Test slip saved.");
    closeDocument();
    await load();
  }

  async function saveProfile() {
    if (!profile) return;
    const response = await fetch("/api/doctor/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    const data = await response.json();
    if (!response.ok) return setError(data.message);
    setMessage(data.message);
  }

  async function saveAvailability() {
    if (!profile) return;
    const response = await fetch("/api/doctor/availability", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ availability: profile.availability }) });
    const data = await response.json();
    if (!response.ok) return setError(data.message);
    setMessage(data.message);
    setProfile({ ...profile, availability: data.availability });
  }

  function editAvailability(day: number, key: "startTime" | "endTime", value: string) {
    if (!profile) return;
    const existing = profile.availability.find((item) => item.dayOfWeek === day);
    const next = profile.availability.filter((item) => item.dayOfWeek !== day);
    next.push({ dayOfWeek: day, startTime: existing?.startTime || "09:00", endTime: existing?.endTime || "17:00", [key]: value });
    setProfile({ ...profile, availability: next.sort((a, b) => a.dayOfWeek - b.dayOfWeek) });
  }

  function printSlip(slip: TestSlip) {
    const rows = slip.tests.map((test) => `<tr><td>${escapeDocumentText(test.name)}</td><td>${escapeDocumentText(test.instructions || "-")}</td></tr>`).join("");
    void printHospitalDocument("Additional Test Slip", `<p>Slip number: <strong>${escapeDocumentText(slip.slipNumber)}</strong></p><p>Patient: <strong>${escapeDocumentText(slip.patientId?.userId?.fullName || "Patient")}</strong></p><p>Issued: ${escapeDocumentText(new Date(slip.issuedAt).toLocaleString("en-IN"))}</p><table><thead><tr><th>Investigation</th><th>Instructions</th></tr></thead><tbody>${rows}</tbody></table>`);
  }

  const visibleAppointments = selectedPatientId ? appointments.filter((item) => item.patient?.id === selectedPatientId) : appointments;
  const visibleRecords = selectedPatientId ? records.filter((record) => record.patientId === selectedPatientId) : records;
  const visitedCount = new Set(records.map((record) => record.patientId).filter(Boolean)).size;
  const documentOpen = Boolean(selected || editingRecord || editingSlip);

  return (
    <main className="cw-page min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="cw-hero rounded-3xl p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">CureWell doctor workspace</p><h1 className="mt-3 text-3xl font-extrabold text-slate-900">Welcome, {doctorDisplayName(name)}</h1><p className="mt-2 text-sm text-slate-600">{email} · Search your patients, review current records, and issue or edit clinical documents.</p></header>
        {(message || error) && <p role={error ? "alert" : "status"} className={`mt-5 rounded-xl p-4 text-sm ${error ? "bg-rose-50 text-rose-800" : "bg-teal-50 text-teal-800"}`}>{error || message}</p>}
        <section className="mt-7 grid gap-4 sm:grid-cols-4"><div className="cw-card rounded-2xl p-5"><p className="text-sm text-slate-500">Appointments</p><p className="mt-2 text-3xl font-extrabold">{appointments.length}</p></div><div className="cw-card rounded-2xl p-5"><p className="text-sm text-slate-500">Visited patients</p><p className="mt-2 text-3xl font-extrabold text-emerald-700">{visitedCount}</p></div><div className="cw-card rounded-2xl p-5"><p className="text-sm text-slate-500">Current records</p><p className="mt-2 text-3xl font-extrabold text-blue-700">{records.length}</p></div><div className="cw-card rounded-2xl p-5"><p className="text-sm text-slate-500">Current test slips</p><p className="mt-2 text-3xl font-extrabold text-indigo-700">{slips.length}</p></div></section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold">Find my patients</h2><p className="mt-1 text-sm text-slate-500">Search is limited to patients who have appointments with you.</p><input value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Search patient name or email" className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm" />{patientSearch && <div className="mt-3 grid gap-2 md:grid-cols-2">{searchPatients.map((patient) => <button key={patient.id} onClick={() => setSelectedPatientId(patient.id)} className={`rounded-xl border p-3 text-left text-sm ${selectedPatientId === patient.id ? "border-blue-400 bg-blue-50" : "border-slate-100"}`}><strong>{patient.fullName}</strong><span className="ml-2 text-slate-500">{patient.email}</span><span className="mt-1 block text-xs text-slate-500">{patient.visited ? "Visited" : "Appointment history"} · {patient.appointmentCount} appointment(s)</span></button>)}{searchPatients.length === 0 && <p className="text-sm text-slate-500">No matching patients found.</p>}</div>}{selectedPatientId && <button onClick={() => setSelectedPatientId("")} className="mt-3 text-sm font-bold text-blue-700">Clear patient filter</button>}</section>

        <div className="mt-8 grid gap-7 lg:grid-cols-[1.5fr_1fr]"><section><h2 className="text-xl font-extrabold text-slate-900">{selectedPatientId ? "Selected patient appointments" : "My schedule"}</h2><div className="mt-4 space-y-3">{visibleAppointments.length ? visibleAppointments.map((item) => { const canPrescription = ["scheduled", "confirmed"].includes(item.status); const canTest = ["scheduled", "confirmed", "completed"].includes(item.status); return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold text-slate-900">{item.patient?.name || "Patient"}</h3><p className="mt-1 text-sm text-slate-500">{new Date(item.appointmentDate).toLocaleDateString("en-IN")} · {item.startTime}–{item.endTime}</p><p className="mt-2 text-sm text-slate-700">{item.reason}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{item.status.replace("_", " ")}</span></div><div className="mt-4 flex flex-wrap gap-2">{item.status === "scheduled" && <button onClick={() => void updateAppointment(item.id, "confirm")} className="cw-primary rounded-xl px-3 py-2 text-xs font-bold">Confirm</button>}{canPrescription && <button onClick={() => openPrescription(item)} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">Issue prescription</button>}{canTest && <button onClick={() => openTestSlip(item)} className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700">Issue test slip</button>}{["scheduled", "confirmed"].includes(item.status) && <button onClick={() => void updateAppointment(item.id, "no_show")} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700">No-show</button>}{item.status === "confirmed" && <button onClick={() => void updateAppointment(item.id, "complete")} className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700">Complete</button>}</div></article>; }) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">No appointments found.</p>}</div>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold">Visited patients and current records</h2><p className="mt-1 text-sm text-slate-500">Only the newest version of each record is shown.</p><div className="mt-4 space-y-3">{visibleRecords.map((record) => <article key={record.id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{record.patientName || "Patient"}</h3><p className="text-sm text-slate-500">{new Date(record.visitDate).toLocaleDateString("en-IN")} · {record.diagnosis} · Version {record.version || 1}</p></div><button onClick={() => openEditPrescription(record)} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">Edit prescription</button></div>{record.treatmentNotes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{record.treatmentNotes}</p>}{record.prescriptions.length > 0 && <ul className="mt-3 space-y-1 text-sm text-slate-700">{record.prescriptions.map((item, index) => <li key={`${item.medication}-${index}`}><strong>{item.medication}</strong> · {item.dosage} · {item.frequency}{item.duration ? ` · ${item.duration}` : ""}</li>)}</ul>}</article>)}{visibleRecords.length === 0 && <p className="text-sm text-slate-500">No current records found.</p>}</div></section>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold">Current test slips</h2><p className="mt-1 text-sm text-slate-500">Superseded slips are hidden from every profile.</p><div className="mt-4 space-y-3">{slips.map((slip) => <article key={slip._id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{slip.slipNumber}</strong><p className="text-sm text-slate-500">{slip.patientId?.userId?.fullName || "Patient"} · Version {slip.version || 1}</p></div><div className="flex gap-2"><button onClick={() => openEditTestSlip(slip)} className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700">Edit</button><button onClick={() => printSlip(slip)} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">Download / print</button></div></div><ul className="mt-3 list-disc pl-5 text-sm text-slate-700">{slip.tests.map((test, index) => <li key={index}>{test.name}{test.instructions ? ` — ${test.instructions}` : ""}</li>)}</ul></article>)}{slips.length === 0 && <p className="text-sm text-slate-500">No current test slips issued yet.</p>}</div></section>
        </section><section className="space-y-7"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold text-slate-900">Professional profile</h2>{profile && <div className="mt-4 space-y-3"><input value={profile.specialization} onChange={(event) => setProfile({ ...profile, specialization: event.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Specialization" /><input value={profile.qualification.join(", ")} onChange={(event) => setProfile({ ...profile, qualification: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Qualifications" /><div className="grid grid-cols-2 gap-3"><input type="number" value={profile.experienceYears} onChange={(event) => setProfile({ ...profile, experienceYears: Number(event.target.value) })} className="rounded-xl border border-slate-200 p-3 text-sm" /><input type="number" value={profile.consultationFee} onChange={(event) => setProfile({ ...profile, consultationFee: Number(event.target.value) })} className="rounded-xl border border-slate-200 p-3 text-sm" /></div><textarea value={profile.bio || ""} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Professional bio" /><button onClick={() => void saveProfile()} className="cw-primary rounded-xl px-4 py-2.5 text-sm font-bold">Save profile</button></div>}</div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold text-slate-900">Working hours</h2>{profile && <div className="mt-4 space-y-2">{days.map((day, index) => { const slot = profile.availability.find((item) => item.dayOfWeek === index); return <div key={day} className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 text-sm"><span>{day}</span><input type="time" value={slot?.startTime || ""} onChange={(event) => editAvailability(index, "startTime", event.target.value)} className="rounded-lg border border-slate-200 p-2" /><input type="time" value={slot?.endTime || ""} onChange={(event) => editAvailability(index, "endTime", event.target.value)} className="rounded-lg border border-slate-200 p-2" /></div>; })}<button onClick={() => void saveAvailability()} className="cw-primary mt-3 rounded-xl px-4 py-2.5 text-sm font-bold">Save availability</button></div>}</div></section></div>

        {documentOpen && mode === "prescription" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-5"><div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between gap-3"><div><h2 className="text-xl font-extrabold">{editingRecord ? "Edit prescription" : "Issue prescription"}</h2><p className="text-sm text-slate-500">Patient: {editingRecord?.patientName || selected?.patient?.name || "Patient"}</p></div><button type="button" onClick={closeDocument} className="text-xl">×</button></div>{error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<textarea value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="Diagnosis" className="mt-5 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" /><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Treatment notes" className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm" />{medications.map((item, index) => <div key={index} className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">Medicine {index + 1}</h3>{medications.length > 1 && <button type="button" onClick={() => setMedications((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-bold text-rose-700">Remove</button>}</div><div className="mt-3 grid gap-3 sm:grid-cols-2">{([["medication", "Medicine name"], ["dosage", "Dosage"], ["route", "Route"], ["frequency", "Frequency"], ["timing", "Timing"], ["duration", "Duration"], ["quantity", "Quantity"]] as [keyof Medication, string][]).map(([key, placeholder]) => <input key={key} value={item[key]} onChange={(event) => updateMedication(index, key, event.target.value)} placeholder={placeholder} className="rounded-xl border border-slate-200 p-3 text-sm" />)}</div><textarea value={item.instructions} onChange={(event) => updateMedication(index, "instructions", event.target.value)} placeholder="Special instructions" className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm" /></div>)}<button type="button" onClick={() => setMedications((current) => [...current, emptyMedication()])} className="mt-4 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-bold text-blue-700">+ Add another medicine</button><input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm" /><button type="button" disabled={savingPrescription} onClick={() => void savePrescription()} className="cw-primary mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">{savingPrescription ? "Saving prescription…" : editingRecord ? "Save newest prescription version" : "Issue prescription"}</button></div></div>}
        {documentOpen && mode === "test" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-5"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between gap-3"><div><h2 className="text-xl font-extrabold">{editingSlip ? "Edit test slip" : "Issue test slip"}</h2><p className="text-sm text-slate-500">Patient: {editingSlip?.patientId?.userId?.fullName || selected?.patient?.name || "Patient"}</p></div><button onClick={closeDocument} className="text-xl">×</button></div><input value={testName} onChange={(event) => setTestName(event.target.value)} placeholder="Investigation / test name" className="mt-5 w-full rounded-xl border border-slate-200 p-3 text-sm" /><textarea value={testInstructions} onChange={(event) => setTestInstructions(event.target.value)} placeholder="Instructions for the patient or laboratory" className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" /><button onClick={() => void issueTestSlip()} className="cw-primary mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold">{editingSlip ? "Save newest test-slip version" : "Issue test slip"}</button></div></div>}
      </div>
    </main>
  );
}
