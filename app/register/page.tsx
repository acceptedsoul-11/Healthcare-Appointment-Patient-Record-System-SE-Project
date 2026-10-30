
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CureWellLogo from "@/components/CureWellLogo";

type RegistrationErrors = {
  fullName?: string[];
  email?: string[];
  password?: string[];
  phone?: string[];
  dateOfBirth?: string[];
  address?: string[];
};

export default function RegisterPage() {
  const router = useRouter();

  const [today, setToday] = useState("");
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<RegistrationErrors>({});

  useEffect(() => {
    const now = new Date();

    const localDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );

    setToday(localDate.toISOString().slice(0, 10));
    setCurrentYear(now.getFullYear());
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrors({});

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: normalizedEmail,
          password,
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          ...(dateOfBirth ? { dateOfBirth } : {}),
          ...(address.trim() ? { address: address.trim() } : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
        }

        setMessage(
          result.message || "Registration failed. Please try again."
        );
        return;
      }

      setMessage(
        "Your patient account has been created successfully. Please sign in."
      );

      setTimeout(() => {
        router.push("/login?registered=true");
      }, 1200);
    } catch {
      setMessage(
        "Unable to connect to the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";

  function fieldError(field: keyof RegistrationErrors) {
    const error = errors[field]?.[0];

    return error ? (
      <p className="mt-1 text-xs text-red-600">{error}</p>
    ) : null;
  }

  return (
    <main className="cw-auth-page">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left brand panel */}
        <section className="cw-auth-brand relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute -right-24 top-24 h-80 w-80 rounded-full border border-blue-200/70" />
          <div className="absolute -right-12 top-36 h-56 w-56 rounded-full border border-blue-200/70" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-blue-100/60" />

          <CureWellLogo className="relative" />

          <div className="relative max-w-lg py-12">
            <span className="inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-blue-700">
              YOUR HEALTH, OUR PRIORITY
            </span>

            <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight text-slate-900 xl:text-6xl">
              A healthier
              <br />
              tomorrow starts
              <br />
              <span className="text-blue-600">with you.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
              Create your patient account to discover trusted doctors,
              manage appointments and keep your healthcare journey organized.
            </p>

            <div className="mt-10 space-y-5">
              {[
                "Find doctors across specialties",
                "Manage your appointments in one place",
                "Access your healthcare information securely",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm text-white">
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

        {/* Registration form */}
        <section className="cw-auth-content flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="cw-auth-card w-full max-w-xl">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900 lg:hidden"
            >
              <span className="text-lg">←</span>
              Back to home
            </Link>

            <div className="mb-8">
              <CureWellLogo className="mb-5 lg:hidden" />

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                Patient registration
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Create your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Join CureWell to manage your healthcare journey with ease.
              </p>
            </div>

            {message && (
              <div
                role="status"
                aria-live="polite"
                className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                  message.includes("successfully")
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="text-sm font-semibold text-slate-700"
                >
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className={inputClass}
                />
                {fieldError("fullName")}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
                {fieldError("email")}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={72}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className={`${inputClass} pr-16`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 text-xs font-semibold text-teal-700 hover:text-teal-900"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {fieldError("password")}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Confirm password{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={72}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`${inputClass} pr-16`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-3 text-xs font-semibold text-teal-700 hover:text-teal-900"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Phone number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={20}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your contact number"
                    className={inputClass}
                  />
                  {fieldError("phone")}
                </div>

                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Date of birth
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    autoComplete="bday"
                    max={today || undefined}
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={inputClass}
                  />
                  {fieldError("dateOfBirth")}
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="text-sm font-semibold text-slate-700"
                >
                  Address{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  rows={2}
                  maxLength={300}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your residential address"
                  className={`${inputClass} resize-y`}
                />
                {fieldError("address")}
              </div>

              <p className="text-xs leading-5 text-slate-500">
                By creating an account, you agree to use CureWell responsibly
                and provide accurate registration information.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="cw-auth-primary flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-teal-300/30 disabled:cursor-not-allowed"
              >
                {loading ? "Creating your account..." : "Create patient account"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-700 hover:text-blue-900"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-8 text-center text-xs text-slate-500">
              © {currentYear ?? ""} CureWell Multispecialty Hospital
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
