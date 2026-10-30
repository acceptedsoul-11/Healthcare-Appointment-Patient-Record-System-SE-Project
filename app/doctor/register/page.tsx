"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import CureWellLogo from "@/components/CureWellLogo";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorRegistrationPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const availability = useMemo(
    () => selectedDays.map((dayOfWeek) => ({ dayOfWeek, startTime: "09:00", endTime: "17:00" })),
    [selectedDays]
  );

  function selectPhoto(file: File | null) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("Choose a JPG, PNG, or WebP image smaller than 5 MB.");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== form.get("confirmPassword")) return setMessage("Passwords do not match.");
    if (!selectedDays.length) return setMessage("Select at least one availability day.");
    form.set("availability", JSON.stringify(availability));
    if (photo) form.set("profilePhoto", photo);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/doctor-register", { method: "POST", body: form });
      const data = await response.json();
      setMessage(data.message || "Unable to submit your application.");
      if (response.ok) event.currentTarget.reset();
    } catch {
      setMessage("Unable to submit your application. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const input = "mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none transition";

  return (
    <main className="cw-auth-page px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/login" className="text-sm font-semibold text-blue-700 hover:text-blue-900">← Back to sign in</Link>
        <header className="cw-hero mt-8 rounded-3xl p-7 sm:p-10">
          <CureWellLogo />
          <p className="cw-eyebrow mt-7 text-xs font-bold uppercase tracking-[.18em]">CureWell Multispecialty Hospital</p>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Doctor application</h1>
          <p className="cw-hero-copy mt-3 text-sm leading-6">Submit your professional details for administrator review. You will receive access only after approval.</p>
        </header>

        {message && <p role="status" className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{message}</p>}

        <form onSubmit={submit} className="cw-auth-card mt-6 space-y-6">
          <section>
            <h2 className="text-lg font-extrabold">Personal information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Full name<input required name="fullName" minLength={2} className={input} /></label>
              <label className="text-sm font-semibold">Email address<input required name="email" type="email" className={input} /></label>
              <label className="text-sm font-semibold">Password<input required name="password" type="password" minLength={8} className={input} /></label>
              <label className="text-sm font-semibold">Confirm password<input required name="confirmPassword" type="password" minLength={8} className={input} /></label>
              <label className="text-sm font-semibold sm:col-span-2">Phone number<input name="phone" type="tel" maxLength={20} className={input} /></label>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-extrabold">Professional information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Specialization<input required name="specialization" className={input} /></label>
              <label className="text-sm font-semibold">Qualifications <span className="font-normal text-slate-500">(comma-separated)</span><input required name="qualifications" className={input} /></label>
              <label className="text-sm font-semibold">Years of experience<input required name="experienceYears" type="number" min="0" max="70" className={input} /></label>
              <label className="text-sm font-semibold">Consultation fee (₹)<input required name="consultationFee" type="number" min="0" className={input} /></label>
              <label className="text-sm font-semibold sm:col-span-2">Medical registration / license number<input required name="licenseNumber" className={input} /></label>
              <label className="text-sm font-semibold sm:col-span-2">Professional biography<textarea name="bio" maxLength={1000} rows={4} className={input} /></label>
              <label className="text-sm font-semibold sm:col-span-2">Credentials for review <span className="font-normal text-slate-500">(optional)</span><textarea name="credentialDetails" maxLength={2000} rows={3} className={input} /></label>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-extrabold">Availability</h2>
            <p className="mt-1 text-sm text-slate-600">Selected days use 09:00–17:00 initially; an administrator can review the schedule before approval.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {days.map((day, index) => <button key={day} type="button" aria-pressed={selectedDays.includes(index)} onClick={() => setSelectedDays((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${selectedDays.includes(index) ? "cw-auth-primary" : "cw-auth-secondary"}`}>{day}</button>)}
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-extrabold">Profile photo <span className="text-sm font-normal text-slate-500">(optional)</span></h2>
            <div className="mt-4 flex items-center gap-4">
              {photoPreview ? <img src={photoPreview} alt="Selected profile preview" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-blue-200" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-700">+</div>}
              <label className="cw-auth-secondary cursor-pointer rounded-xl border px-4 py-3 text-sm font-semibold">Select JPG, PNG, or WebP (max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectPhoto(event.target.files?.[0] || null)} /></label>
            </div>
          </section>

          <button disabled={loading} className="cw-auth-primary w-full rounded-xl px-5 py-3.5 text-sm font-bold transition">{loading ? "Submitting application…" : "Submit for approval"}</button>
        </form>
      </div>
    </main>
  );
}
