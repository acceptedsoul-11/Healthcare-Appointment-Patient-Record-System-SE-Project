
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PatientSidebar from "@/components/PatientSidebar";

type User = {
  id?: string;
  _id?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

type Doctor = {
  id?: string;
  name?: string;
  fullName?: string;
  specialization?: string;
};

type Appointment = {
  id?: string;
  _id?: string;
  appointmentDate?: string;
  date?: string;
  startTime?: string;
  time?: string;
  status?: string;
  doctor?: Doctor | null;
  doctorId?: Doctor | string;
  doctorName?: string;
  specialization?: string;
  reason?: string;
};

type MedicalRecord = {
  id?: string;
  _id?: string;
  title?: string;
  type?: string;
  date?: string;
  createdAt?: string;
};

type DashboardState = {
  user: User | null;
  appointments: Appointment[];
  records: MedicalRecord[];
  loading: boolean;
  error: string;
};

function extractArray<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const object = payload as Record<string, unknown>;

  for (const key of keys) {
    if (Array.isArray(object[key])) return object[key] as T[];
  }

  if (object.data && typeof object.data === "object") {
    const nested = object.data as Record<string, unknown>;

    for (const key of keys) {
      if (Array.isArray(nested[key])) return nested[key] as T[];
    }
  }

  return [];
}

function formatDate(value?: string) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAppointmentDate(appointment: Appointment) {
  return appointment.appointmentDate || appointment.date;
}

function getAppointmentTime(appointment: Appointment) {
  return appointment.startTime || appointment.time;
}

function getDoctor(appointment: Appointment): Doctor | null {
  if (appointment.doctor && typeof appointment.doctor === "object") {
    return appointment.doctor;
  }

  if (appointment.doctorId && typeof appointment.doctorId === "object") {
    return appointment.doctorId;
  }

  return null;
}

function getDoctorName(appointment: Appointment) {
  const doctor = getDoctor(appointment);

  return (
    doctor?.name ||
    doctor?.fullName ||
    appointment.doctorName ||
    "Doctor details unavailable"
  );
}

function getSpecialty(appointment: Appointment) {
  const doctor = getDoctor(appointment);

  return (
    doctor?.specialization ||
    appointment.specialization ||
    "Specialty not specified"
  );
}

function getStatusStyle(status?: string) {
  const value = (status || "").toLowerCase();

  if (value.includes("cancel") || value.includes("reject")) {
    return "bg-rose-50 text-rose-700 ring-rose-600/15";
  }

  if (value.includes("complete")) {
    return "bg-sky-50 text-sky-700 ring-sky-600/15";
  }

  if (value.includes("confirm") || value.includes("scheduled")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/15";
  }

  if (value.includes("pending")) {
    return "bg-amber-50 text-amber-700 ring-amber-600/15";
  }

  return "bg-slate-100 text-slate-600 ring-slate-500/15";
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardState>({
    user: null,
    appointments: [],
    records: [],
    loading: true,
    error: "",
  });

  const [signedIn, setSignedIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    setDashboard((previous) => ({
      ...previous,
      loading: true,
      error: "",
    }));

    try {
      const userResponse = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      if (userResponse.status === 401 || userResponse.status === 403) {
        setSignedIn(false);
        setDashboard({
          user: null,
          appointments: [],
          records: [],
          loading: false,
          error: "",
        });
        return;
      }

      if (!userResponse.ok) {
        throw new Error("Unable to verify your account. Please try again.");
      }

      const userPayload = await userResponse.json();

      const user: User | null =
        userPayload?.user ??
        userPayload?.data?.user ??
        (userPayload?.id || userPayload?._id ? userPayload : null);

      if (!user) {
        setSignedIn(false);
        setDashboard({
          user: null,
          appointments: [],
          records: [],
          loading: false,
          error: "",
        });
        return;
      }

      setSignedIn(true);

      const roleRoutes: Record<string, string> = {
        doctor: "/doctor",
        receptionist: "/receptionist",
        administrator: "/admin",
      };

      const destination = user.role
        ? roleRoutes[user.role.toLowerCase()]
        : undefined;

      if (destination) {
        router.replace(destination);
        return;
      }

      const results = await Promise.allSettled([
        fetch("/api/appointments", { cache: "no-store" }),
        fetch("/api/records", { cache: "no-store" }),
      ]);

      let appointments: Appointment[] = [];
      let records: MedicalRecord[] = [];
      const errors: string[] = [];

      if (results[0].status === "fulfilled" && results[0].value.ok) {
        try {
          appointments = extractArray<Appointment>(
            await results[0].value.json(),
            ["appointments"]
          );
        } catch {
          errors.push("appointments");
        }
      } else {
        errors.push("appointments");
      }

      if (results[1].status === "fulfilled" && results[1].value.ok) {
        try {
          records = extractArray<MedicalRecord>(
            await results[1].value.json(),
            ["records", "medicalRecords"]
          );
        } catch {
          errors.push("medical records");
        }
      } else {
        errors.push("medical records");
      }

      setDashboard({
        user,
        appointments,
        records,
        loading: false,
        error: errors.length
          ? `Unable to load ${errors.join(" and ")}. Check the corresponding API route.`
          : "",
      });
    } catch (error) {
      setDashboard({
        user: null,
        appointments: [],
        records: [],
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load your dashboard.",
      });
      setSignedIn(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const { user, appointments, records, loading, error } = dashboard;

  const upcomingAppointments = appointments.filter((appointment) => {
    const status = (appointment.status || "").toLowerCase();

    if (
      status.includes("cancel") ||
      status.includes("reject") ||
      status.includes("complete") ||
      status === "no_show"
    ) {
      return false;
    }

    const value = getAppointmentDate(appointment);
    if (!value) return false;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    return date >= today;
  });

  const uniqueDoctors = new Set(
    appointments
      .map(getDoctorName)
      .filter((name) => name !== "Doctor details unavailable")
  );

  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "there";

  const initials = (
    user?.fullName ||
    user?.email ||
    "CW"
  )
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Unable to log out. Please try again.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setDashboard((previous) => ({
        ...previous,
        error:
          error instanceof Error
            ? error.message
            : "Unable to log out. Please try again.",
      }));
      setLoggingOut(false);
    }
  }

  const stats = [
    {
      label: "Total appointments",
      value: appointments.length,
      icon: "▦",
    },
    {
      label: "Upcoming appointments",
      value: upcomingAppointments.length,
      icon: "◷",
    },
    {
      label: "Doctors in your visits",
      value: uniqueDoctors.size,
      icon: "✚",
    },
    {
      label: "Medical records",
      value: records.length,
      icon: "▤",
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground lg:flex">
      <PatientSidebar />

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400">
              CureWell / Patient portal
            </p>
            <h1 className="mt-1 text-lg font-bold text-slate-900">
              Dashboard
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {!signedIn ? (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-indigo-50 sm:px-4"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700 sm:px-4"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <div className="hidden text-right sm:block">
                  <p className="max-w-40 truncate text-sm font-semibold text-slate-900">
                    {user?.fullName || user?.email}
                  </p>
                  <p className="mt-0.5 text-[11px] capitalize text-slate-500">
                    {user?.role || "Patient"}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-sm font-bold text-indigo-700">
                  {initials || "CW"}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-800 disabled:opacity-60"
                >
                  {loggingOut ? "Logging out…" : "Logout"}
                </button>
              </>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-8 p-4 sm:p-6 lg:p-9">
          {error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="shrink-0 self-start font-semibold underline sm:self-auto"
              >
                Retry
              </button>
            </div>
          )}

          <section className="cw-hero relative isolate overflow-hidden rounded-3xl p-6 sm:p-9 lg:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-[42px] border-blue-600/[0.05]"
            />
            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-800">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Your healthcare, in one place
              </span>

              <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                {signedIn
                  ? `Welcome back, ${firstName}.`
                  : "Welcome to CureWell."}
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                {signedIn
                  ? "Manage your appointments and keep your healthcare information organized securely."
                  : "Find healthcare professionals, manage appointments, and access your medical information through your account."}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/find-doctors"
                  className="cw-primary rounded-xl px-5 py-3 text-sm font-bold transition"
                >
                  Find a doctor →
                </Link>
                <Link
                  href={signedIn ? "/appointments" : "/login"}
                  className="cw-secondary rounded-xl px-5 py-3 text-sm font-semibold"
                >
                  {signedIn ? "View appointments" : "Sign in to your account"}
                </Link>
              </div>
            </div>
          </section>

          <section>
            <SectionHeading
              eyebrow="Overview"
              title="Your healthcare at a glance"
              description="A summary based on information available from your account."
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm leading-5 text-slate-500">
                      {stat.label}
                    </p>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-700">
                      {stat.icon}
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
                    {loading || !signedIn ? "—" : stat.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {loading
                      ? "Loading your information…"
                      : signedIn
                        ? "Based on account data"
                        : "Sign in to view your information"}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Upcoming appointments
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500">
                    Your scheduled visits.
                  </p>
                </div>
                <Link
                  href="/appointments"
                  className="shrink-0 rounded-lg px-2 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 sm:text-sm"
                >
                  View all →
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                {loading ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    Loading appointments…
                  </p>
                ) : !signedIn ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-800">
                      Sign in to view your appointments
                    </p>
                    <Link
                      href="/login"
                      className="mt-3 inline-block text-sm font-bold text-indigo-700"
                    >
                      Login to continue →
                    </Link>
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
                    <span className="text-2xl text-slate-400">◷</span>
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      No upcoming appointments
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      Your saved appointments will appear here.
                    </p>
                    <Link
                      href="/find-doctors"
                      className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      Find a doctor
                    </Link>
                  </div>
                ) : (
                  upcomingAppointments.slice(0, 5).map((appointment, index) => (
                    <article
                      key={
                        appointment.id ||
                        appointment._id ||
                        `${getAppointmentDate(appointment)}-${getAppointmentTime(appointment)}-${index}`
                      }
                      className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700">
                          ✚
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {getDoctorName(appointment)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {getSpecialty(appointment)}
                          </p>
                          <p className="mt-2 text-xs font-medium text-slate-600">
                            {formatDate(getAppointmentDate(appointment))}
                            {getAppointmentTime(appointment)
                              ? ` · ${getAppointmentTime(appointment)}`
                              : ""}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ${getStatusStyle(appointment.status)}`}
                        >
                          {appointment.status || "Status unavailable"}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <Link
                href="/appointments"
                className="mt-5 flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-indigo-50"
              >
                Manage appointments →
              </Link>
            </Card>

            <div className="space-y-6">
              <Card className="p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Quick access
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Go straight to what you need.
                </p>

                <div className="mt-5 space-y-2.5">
                  {[
                    {
                      title: "Find a doctor",
                      detail: "Explore registered specialists",
                      icon: "✚",
                      href: "/find-doctors",
                    },
                    {
                      title: "Appointments",
                      detail: "Review your scheduled visits",
                      icon: "▦",
                      href: "/appointments",
                    },
                    {
                      title: "Medical records",
                      detail: "Access your healthcare records",
                      icon: "▤",
                      href: "/records",
                    },
                    {
                      title: "My profile",
                      detail: "Review your personal information",
                      icon: "♙",
                      href: "/profile",
                    },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-100 hover:bg-indigo-50/60"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-700">
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-800">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {item.detail}
                        </span>
                      </span>
                      <span className="text-slate-300 group-hover:text-indigo-700">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card className="border-blue-100 bg-blue-50/60 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg text-blue-700 shadow-sm">
                    ♡
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Your health matters
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Keep your appointment details and medical information
                  organized. Access personal records only through your
                  authorized account.
                </p>
              </Card>
            </div>
          </div>

          <footer className="border-t border-slate-200 py-6 text-center">
            <p className="text-xs font-bold text-slate-500">
              CureWell Multispecialty Hospital
            </p>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Care for a Healthier Tomorrow · Patient Portal
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
