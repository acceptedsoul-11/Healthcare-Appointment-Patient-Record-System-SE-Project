
"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CureWellLogo from "@/components/CureWellLogo";

type UserRole = "patient" | "doctor" | "receptionist" | "administrator";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    searchParams.get("registered") === "true"
      ? "Your account was created successfully. Please sign in."
      : ""
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to sign in. Please try again.");
        return;
      }

      const role = result.user?.role as UserRole | undefined;

      const destinations: Record<UserRole, string> = {
        patient: "/",
        doctor: "/doctor",
        receptionist: "/receptionist",
        administrator: "/admin",
      };

      if (!role || !(role in destinations)) {
        setError("Your account has an unrecognized role. Please contact support.");
        return;
      }

      router.replace(destinations[role]);
      router.refresh();
    } catch {
      setError("Unable to connect to CureWell. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";

  return (
    <main className="cw-auth-page">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="cw-auth-brand relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute -right-24 top-24 h-80 w-80 rounded-full border border-blue-200/70" />
          <div className="absolute -right-12 top-36 h-56 w-56 rounded-full border border-blue-200/70" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-blue-100/60" />

          <CureWellLogo className="relative" />

          <div className="relative max-w-lg py-12">
            <span className="inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-blue-700">
              WELCOME BACK
            </span>

            <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight text-slate-900 xl:text-6xl">
              Your health
              <br />
              journey, all
              <br />
              <span className="text-blue-600">in one place.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
              Sign in to access your CureWell account, manage appointments and
              stay connected with your healthcare team.
            </p>

            <div className="mt-10 space-y-5">
              {[
                "Convenient appointment management",
                "Trusted healthcare professionals",
                "Your healthcare information in one place",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm text-white">
                    ✓
                  </span>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            Care for a Healthier Tomorrow
          </p>
        </section>

        <section className="cw-auth-content flex items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
          <div className="cw-auth-card w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900 lg:hidden"
            >
              <span className="text-lg">←</span>
              Back to home
            </Link>

            <div className="mb-9">
              <CureWellLogo className="mb-6 lg:hidden" />

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                Secure sign in
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Welcome back
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Enter your account details to continue to CureWell.
              </p>
            </div>

            {success && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                {success}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-semibold"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    maxLength={72}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className={`${inputClass} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cw-auth-primary flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-teal-300/30 disabled:cursor-not-allowed"
              >
                {loading ? "Signing you in..." : "Sign in to CureWell"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold text-slate-500">NEW TO CUREWELL?</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              href="/register"
              className="cw-auth-secondary flex w-full items-center justify-center rounded-xl border px-5 py-3.5 text-sm font-semibold transition"
            >
              Create a patient account
            </Link>

            <Link
              href="/doctor/register"
              className="mt-3 flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 hover:text-blue-900"
            >
              Are you a doctor? Apply to join CureWell
            </Link>

            <p className="mt-8 text-center text-xs leading-5 text-slate-500">
              Your session is protected by CureWell&apos;s secure sign-in
              system.
              <br />
              © {new Date().getFullYear()} CureWell Multispecialty Hospital
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="cw-auth-page flex min-h-screen items-center justify-center text-sm text-slate-600">
          Loading secure sign in...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
