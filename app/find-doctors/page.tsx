"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PatientSidebar from "@/components/PatientSidebar";

type Doctor = { id: string; name: string; specialization: string; qualification: string[]; consultationFee: number; experienceYears: number; bio: string; profileImageUrl: string };

export default function FindDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/doctors")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load doctors.");
        setDoctors(data.doctors || []);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load doctors."))
      .finally(() => setLoading(false));
  }, []);

  const specialties = useMemo(() => [...new Set(doctors.map((doctor) => doctor.specialization))].sort(), [doctors]);
  const displayedDoctors = doctors.filter((doctor) => (!specialization || doctor.specialization === specialization) && `${doctor.name} ${doctor.specialization}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="cw-page lg:flex">
      <PatientSidebar />
      <div className="min-w-0 flex-1 px-5 pb-12 pt-20 sm:px-8 lg:px-10 lg:pt-10">
        <header className="cw-hero mx-auto max-w-7xl rounded-3xl p-7 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">CureWell medical team</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Find the right specialist</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Browse active, approved doctors and make an appointment using their saved consultation availability.</p>
        </header>

        <section className="cw-card mx-auto mt-7 max-w-7xl rounded-2xl p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_260px]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by doctor name or specialty" aria-label="Search doctors" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500" />
            <select value={specialization} onChange={(event) => setSpecialization(event.target.value)} aria-label="Filter by specialization" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"><option value="">All specialties</option>{specialties.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </div>
        </section>

        <section className="mx-auto mt-7 max-w-7xl">
          {loading ? <p className="cw-card rounded-2xl p-10 text-center text-sm text-slate-600">Loading registered doctors…</p> : error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{error}</div> : displayedDoctors.length === 0 ? <div className="cw-card rounded-2xl border-dashed p-12 text-center"><h2 className="font-bold text-slate-900">No doctors found</h2><p className="mt-2 text-sm text-slate-600">{doctors.length ? "Try another name or specialty." : "Approved doctor profiles will appear here once available."}</p></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{displayedDoctors.map((doctor) => <article key={doctor.id} className="cw-card overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"><div className="flex min-h-36 items-center gap-4 bg-blue-50 p-5">{doctor.profileImageUrl ? <img src={doctor.profileImageUrl} alt={`Dr. ${doctor.name}`} className="h-20 w-20 rounded-2xl object-cover" /> : <div aria-hidden className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700">{doctor.name.slice(0, 1)}</div>}<div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{doctor.specialization}</p><h2 className="mt-1 truncate text-lg font-extrabold text-slate-900">Dr. {doctor.name}</h2><p className="mt-1 text-sm text-slate-700">{doctor.experienceYears} years experience</p></div></div><div className="p-5"><p className="line-clamp-2 text-sm text-slate-700">{doctor.bio || "Professional profile available at CureWell."}</p><p className="mt-3 text-xs font-semibold text-slate-600">{doctor.qualification.join(" · ")}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-600">Consultation fee</p><p className="text-lg font-extrabold text-slate-900">₹{doctor.consultationFee.toLocaleString("en-IN")}</p></div><Link href={`/appointments?doctorId=${doctor.id}`} className="cw-primary rounded-xl px-4 py-2.5 text-sm font-bold">Book</Link></div></div></article>)}</div>}
        </section>
      </div>
    </main>
  );
}
