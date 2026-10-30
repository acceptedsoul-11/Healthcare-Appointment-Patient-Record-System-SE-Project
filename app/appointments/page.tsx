
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PatientSidebar from "@/components/PatientSidebar";

type Availability = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  qualification: string[];
  consultationFee: number;
  experienceYears: number;
  bio: string;
  availability: Availability[];
};

type AppointmentResult = {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: string;
};

const specialtyColors: Record<string, string> = {
  Cardiology: "bg-rose-50 text-rose-700",
  Dermatology: "bg-fuchsia-50 text-fuchsia-700",
  Pediatrics: "bg-amber-50 text-amber-700",
  "General Physician": "bg-teal-50 text-teal-700",
};

function getLocalDate() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getSlots(availability: Availability[]) {
  const slots: string[] = [];

  for (const period of availability) {
    const [startHour, startMinute] = period.startTime
      .split(":")
      .map(Number);

    const [endHour, endMinute] = period.endTime.split(":").map(Number);

    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    for (let time = start; time + 30 <= end; time += 30) {
      if (time % 30 !== 0) continue;

      const hours = Math.floor(time / 60);
      const minutes = time % 60;

      const slot = `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}`;

      if (!slots.includes(slot)) slots.push(slot);
    }
  }

  return slots.sort();
}

export default function AppointmentsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All Specialties");

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [appointment, setAppointment] =
    useState<AppointmentResult | null>(null);

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      setLoadingDoctors(true);
      setLoadError("");

      try {
        const response = await fetch("/api/doctors", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load doctors."
          );
        }

        if (!cancelled) {
          setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Unable to load doctors. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    }

    loadDoctors();

    return () => {
      cancelled = true;
    };
  }, []);

  const specialties = useMemo(() => {
    return [
      "All Specialties",
      ...Array.from(
        new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean))
      ).sort(),
    ];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const searchableText = [
        doctor.name,
        doctor.specialization,
        ...(doctor.qualification || []),
        doctor.bio || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const matchesSpecialty =
        specialty === "All Specialties" ||
        doctor.specialization === specialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, search, specialty]);

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !selectedDate) return [];

    // Noon avoids date-boundary changes when determining the weekday.
    const [year, month, day] = selectedDate.split("-").map(Number);
    const weekday = new Date(year, month - 1, day, 12).getDay();

    const availability = selectedDoctor.availability.filter(
      (period) => period.dayOfWeek === weekday
    );

    const slots = getSlots(availability);

    // Do not offer past times for today's date.
    if (selectedDate === getLocalDate()) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      return slots.filter((slot) => {
        const [hours, minutes] = slot.split(":").map(Number);
        return hours * 60 + minutes > currentMinutes;
      });
    }

    return slots;
  }, [selectedDoctor, selectedDate]);

  function openBooking(doctor: Doctor) {
    setSelectedDoctor(doctor);
    setSelectedDate("");
    setSelectedTime("");
    setReason("");
    setError("");
    setSuccess("");
    setAppointment(null);
  }

  function closeBooking() {
    if (booking) return;

    setSelectedDoctor(null);
    setError("");
  }

  async function confirmBooking() {
    if (!selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) {
      setError("Please select a date and time and enter a reason for your visit.");
      return;
    }

    setBooking(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          appointmentDate: selectedDate,
          startTime: selectedTime,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to book your appointment."
        );
      }

      setAppointment(data.appointment);
      setSuccess(data.message || "Your appointment has been booked.");
      setSelectedDoctor(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBooking(false);
    }
  }

  return (
    <main className="cw-page lg:flex">
      <PatientSidebar />

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 pl-[76px] backdrop-blur-xl sm:px-7 sm:pl-[88px] lg:px-9 lg:pl-9">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-400">
              CureWell / Patient Portal / Appointments
            </p>
            <h1 className="mt-1 truncate text-lg font-extrabold text-slate-900 sm:text-xl">
              Appointments & Find Doctors
            </h1>
          </div>

          <Link
            href="/appointments"
            className="hidden rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex"
          >
            My appointments
          </Link>
        </header>

        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-9">
          <section className="cw-hero relative isolate overflow-hidden rounded-[28px] p-6 sm:p-9 lg:p-10">
            <div className="pointer-events-none absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full border-[44px] border-blue-200/60" />
            <div className="pointer-events-none absolute bottom-[-100px] right-[22%] -z-10 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />

            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-800">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Care for a Healthier Tomorrow
              </span>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[42px]">
                Find your doctor.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Explore our medical team, review consultation fees and request
                an appointment using the doctor&apos;s recorded availability.
              </p>

              <a
                href="#doctor-directory"
                className="cw-primary mt-7 inline-flex rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5"
              >
                Explore our doctors ↓
              </a>
            </div>

            <div className="relative mt-8 grid max-w-xl grid-cols-2 gap-3 border-t border-blue-200 pt-5">
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{doctors.length}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Registered doctors
                </p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {Math.max(0, specialties.length - 1)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Specialties represented
                </p>
              </div>
            </div>
          </section>

          {success && (
            <section
              role="status"
              className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl text-teal-700">
                  ✓
                </span>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-teal-900">
                    Appointment request saved
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-teal-800">
                    {success}
                  </p>
                  {appointment && (
                    <p className="mt-2 text-sm font-semibold text-teal-900">
                      {formatDate(selectedDate || String(appointment.appointmentDate).slice(0, 10))}
                      {" · "}
                      {formatTime(appointment.startTime)}
                      {" · "}
                      Booking reference: {appointment.id}
                    </p>
                  )}
                  <Link
                    href="/appointments"
                    className="mt-3 inline-block text-sm font-bold text-teal-900 underline underline-offset-4"
                  >
                    View appointments
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section id="doctor-directory" className="mt-9 scroll-mt-28">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
                Our medical team
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                Find the right specialist
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Search by doctor name, qualification or medical specialty.
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
              <label className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
                <span aria-hidden="true" className="text-xl text-indigo-500">
                  ⌕
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search doctors, specialties or qualifications..."
                  className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  aria-label="Search doctors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    ×
                  </button>
                )}
              </label>

              <label className="relative">
                <span className="sr-only">Filter by specialty</span>
                <select
                  value={specialty}
                  onChange={(event) => setSpecialty(event.target.value)}
                  aria-label="Filter by specialty"
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                >
                  {specialties.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  ▾
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <strong className="font-bold text-slate-900">
                  {filteredDoctors.length}
                </strong>{" "}
                {filteredDoctors.length === 1 ? "doctor" : "doctors"}
              </p>

              {(specialty !== "All Specialties" || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSpecialty("All Specialties");
                  }}
                  className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                >
                  Clear filters ×
                </button>
              )}
            </div>

            {loadError && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5"
              >
                <p className="font-bold text-rose-900">
                  Could not load the doctor directory
                </p>
                <p className="mt-2 text-sm text-rose-800">{loadError}</p>
                <p className="mt-2 text-xs leading-5 text-rose-700">
                  Make sure you are signed in and your MongoDB connection is
                  configured correctly.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-800"
                >
                  Try again
                </button>
              </div>
            )}

            {loadingDoctors && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-slate-100" />
                    <div className="mt-5 h-5 w-2/3 rounded bg-slate-100" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
                    <div className="mt-6 h-4 w-full rounded bg-slate-100" />
                    <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
                    <div className="mt-8 h-11 rounded-xl bg-slate-100" />
                  </div>
                ))}
              </div>
            )}

            {!loadingDoctors && !loadError && (
              <>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredDoctors.map((doctor) => {
                    const initials = doctor.name
                      .replace(/^Dr\.?\s*/i, "")
                      .split(/\s+/)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    const badgeClass =
                      specialtyColors[doctor.specialization] ||
                      "bg-indigo-50 text-indigo-700";

                    return (
                      <article
                        key={doctor.id}
                        className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-200/60 sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-indigo-50 text-lg font-extrabold text-indigo-700">
                            {initials || "DR"}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold ${badgeClass}`}
                          >
                            {doctor.specialization}
                          </span>
                        </div>

                        <div className="mt-5">
                          <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                            {doctor.name}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {doctor.qualification?.length
                              ? doctor.qualification.join(", ")
                              : "Qualifications not provided"}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {doctor.experienceYears}{" "}
                            {doctor.experienceYears === 1
                              ? "year"
                              : "years"}{" "}
                            of experience
                          </p>
                          {doctor.bio && (
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                              {doctor.bio}
                            </p>
                          )}
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                          <div>
                            <p className="text-xs text-slate-500">
                              Consultation fee
                            </p>
                            <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                              ₹{doctor.consultationFee.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            <span className="text-teal-600">●</span>{" "}
                            Availability listed
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={!doctor.availability?.length}
                          onClick={() => openBooking(doctor)}
                          className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                        >
                          {doctor.availability?.length
                            ? "Book an appointment →"
                            : "Availability not configured"}
                        </button>
                      </article>
                    );
                  })}
                </div>

                {filteredDoctors.length === 0 && (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
                      ⌕
                    </div>
                    <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                      {doctors.length === 0
                        ? "No doctors registered yet"
                        : "No matching doctors found"}
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      {doctors.length === 0
                        ? "The directory will display doctors once their accounts and professional profiles have been added to the database."
                        : "Try another name or qualification, or choose a different medical specialty."}
                    </p>
                    {doctors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setSpecialty("All Specialties");
                        }}
                        className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="mt-9 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
              <p className="font-bold text-indigo-900">
                Choose a convenient time
              </p>
              <p className="mt-2 text-sm leading-6 text-indigo-800/80">
                Appointment options are generated from each doctor&apos;s
                configured weekly availability. The server checks the selected
                slot again when you submit.
              </p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
              <p className="font-bold text-teal-900">Your privacy matters</p>
              <p className="mt-2 text-sm leading-6 text-teal-800/80">
                Your appointment request is submitted to the hospital API.
                Only book appointments for your own patient account.
              </p>
            </div>
          </section>

          <footer className="mt-12 border-t border-slate-200 py-6 text-center">
            <p className="text-xs font-bold text-slate-600">
              CureWell Multispecialty Hospital
            </p>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Care for a Healthier Tomorrow · Patient Portal
            </p>
          </footer>
        </div>
      </section>

      {selectedDoctor && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={closeBooking}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            className="my-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-700">
                  ✚
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700">
                  CureWell · Appointment request
                </p>
                <h2
                  id="booking-title"
                  className="mt-2 text-xl font-extrabold text-slate-900"
                >
                  {selectedDoctor.name}
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  {selectedDoctor.specialization}
                </p>
                <p className="mt-3 text-lg font-extrabold text-indigo-700">
                  ₹{selectedDoctor.consultationFee.toLocaleString("en-IN")}
                  <span className="ml-1 text-xs font-medium text-slate-500">
                    / consultation
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeBooking}
                disabled={booking}
                aria-label="Close booking form"
                className="shrink-0 rounded-xl px-2.5 py-1 text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs leading-5 text-slate-600">
                Appointments are 30 minutes long. Choose a date and an available
                start time, then tell us briefly why you need the consultation.
              </p>
            </div>

            <label
              htmlFor="appointment-date"
              className="mt-6 block text-sm font-bold text-slate-700"
            >
              Preferred date
            </label>
            <input
              id="appointment-date"
              type="date"
              min={getLocalDate()}
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSelectedTime("");
                setError("");
              }}
              disabled={booking}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />

            {selectedDate && (
              <p className="mt-2 text-xs text-slate-500">
                {formatDate(selectedDate)}
              </p>
            )}

            <p className="mt-5 text-sm font-bold text-slate-700">
              Available start times
            </p>

            {!selectedDate && (
              <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Select a date to see the doctor&apos;s available time options.
              </p>
            )}

            {selectedDate && availableSlots.length === 0 && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                No appointment times are available for this doctor on the
                selected date. Try another date.
              </p>
            )}

            {selectedDate && availableSlots.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    aria-pressed={selectedTime === time}
                    onClick={() => {
                      setSelectedTime(time);
                      setError("");
                    }}
                    disabled={booking}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      selectedTime === time
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
            )}

            <label
              htmlFor="appointment-reason"
              className="mt-5 block text-sm font-bold text-slate-700"
            >
              Reason for visit
            </label>
            <textarea
              id="appointment-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Briefly describe why you need an appointment..."
              disabled={booking}
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">
              {reason.length}/500
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm leading-6 text-rose-800"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={
                booking ||
                !selectedDate ||
                !selectedTime ||
                !reason.trim()
              }
              onClick={confirmBooking}
              className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {booking ? "Booking appointment..." : "Confirm appointment →"}
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
              The server verifies the selected time before saving your request.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
