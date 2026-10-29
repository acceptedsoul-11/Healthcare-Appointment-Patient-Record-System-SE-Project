
"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    appointments: true,
    reminders: true,
    reports: false,
    newsletter: false,
  });

  const [appearance, setAppearance] = useState("Light");
  const [language, setLanguage] = useState("English");
  const [saved, setSaved] = useState(false);

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
    setSaved(false);
  }

  const sections = [
    { label: "Dashboard", href: "/", icon: "▦" },
    { label: "Appointments", href: "/appointments", icon: "▣" },
    { label: "Medical Records", href: "/records", icon: "▤" },
    { label: "My Profile", href: "/profile", icon: "♙" },
    { label: "Settings", href: "/settings", icon: "⚙" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fc] text-slate-800 md:flex">
      <aside className="border-b border-slate-200 bg-white p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <Link href="/" className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">
            +
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-indigo-700">
              CureWell
            </h1>
            <p className="text-xs text-slate-500">Multispecialty Hospital</p>
          </div>
        </Link>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
          Workspace
        </p>

        <nav className="flex flex-wrap gap-2 md:flex-col">
          {sections.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                item.label === "Settings"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 p-5 text-white md:block">
          <div className="mb-3 text-2xl">♡</div>
          <p className="font-bold">Your health matters.</p>
          <p className="mt-2 text-sm leading-6 text-indigo-50">
            Care for a Healthier Tomorrow.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold text-indigo-600">
              CureWell / Settings
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Settings
            </h2>
            <p className="mt-2 text-slate-500">
              Customize your experience and manage your preferences.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-slate-50"
          >
            ← Back to Dashboard
          </Link>
        </header>

        {saved && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
          >
            ✓ Your preferences have been updated for this session.
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-700">
                  ♧
                </div>
                <div>
                  <h3 className="text-lg font-bold">Notifications</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose which updates you would like to receive.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {(
                  [
                    ["appointments", "Appointment updates", "Get notified about appointment changes."],
                    ["reminders", "Appointment reminders", "Receive reminders before scheduled visits."],
                    ["reports", "Medical report updates", "Get an alert when a report is available."],
                    ["newsletter", "Health tips and news", "Receive general health information."],
                  ] as const
                ).map(([key, title, description]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {description}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications[key]}
                      aria-label={title}
                      onClick={() => toggleNotification(key)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        notifications[key] ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          notifications[key] ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-xl text-teal-700">
                  ◐
                </div>
                <div>
                  <h3 className="text-lg font-bold">Appearance</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Set your preferred display options.
                  </p>
                </div>
              </div>

              <label className="mb-3 block text-sm font-semibold">
                Theme
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {["Light", "Dark"].map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => {
                      setAppearance(theme);
                      setSaved(false);
                    }}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      appearance === theme
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-20 items-center justify-center rounded-lg border ${
                        theme === "Dark"
                          ? "border-slate-700 bg-slate-800"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="w-24 space-y-2">
                        <div className={`h-2 w-12 rounded ${theme === "Dark" ? "bg-indigo-400" : "bg-indigo-600"}`} />
                        <div className={`h-2 w-24 rounded ${theme === "Dark" ? "bg-slate-500" : "bg-slate-200"}`} />
                        <div className={`h-2 w-16 rounded ${theme === "Dark" ? "bg-slate-500" : "bg-slate-200"}`} />
                      </div>
                    </div>
                    <p className="font-bold">{theme} mode</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {theme === "Light"
                        ? "A clean, bright interface"
                        : "A darker interface preview"}
                    </p>
                    {appearance === theme && (
                      <p className="mt-2 text-xs font-bold text-indigo-600">
                        ✓ Selected
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {appearance === "Dark" && (
                <p className="mt-3 text-xs text-amber-700">
                  Dark mode is a preview selection only; the whole application
                  theme is not changed yet.
                </p>
              )}

              <div className="mt-6">
                <label
                  htmlFor="language"
                  className="mb-2 block text-sm font-semibold"
                >
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(event) => {
                    setLanguage(event.target.value);
                    setSaved(false);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none sm:max-w-sm"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Kannada</option>
                  <option>Telugu</option>
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Language selection is a UI preference preview.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-xl text-rose-600">
                  ♙
                </div>
                <div>
                  <h3 className="text-lg font-bold">Privacy & Security</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Keep your account information protected.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold">Account security</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Always sign out when using a shared device. Do not share
                  passwords or sensitive medical information.
                </p>
                <Link
                  href="/profile"
                  className="mt-3 inline-block text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Review profile information →
                </Link>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setSaved(true)}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                Save Preferences
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotifications({
                    appointments: true,
                    reminders: true,
                    reports: false,
                    newsletter: false,
                  });
                  setAppearance("Light");
                  setLanguage("English");
                  setSaved(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-teal-500 p-6 text-white shadow-lg">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                ✦
              </div>
              <h3 className="text-xl font-extrabold">Your experience, your way.</h3>
              <p className="mt-3 text-sm leading-6 text-indigo-50">
                Manage your preferences and make your CureWell experience more
                comfortable.
              </p>
              <div className="mt-6 border-t border-white/20 pt-5">
                <p className="text-sm font-semibold">CureWell Multispecialty Hospital</p>
                <p className="mt-1 text-xs text-indigo-100">
                  Care for a Healthier Tomorrow
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold">Current preferences</h3>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Theme</span>
                  <span className="font-semibold">{appearance}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Language</span>
                  <span className="font-semibold">{language}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Notifications</span>
                  <span className="font-semibold">
                    {Object.values(notifications).filter(Boolean).length} enabled
                  </span>
                </div>
              </div>
              <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
                Demo preferences are stored in page state only and reset when
                this page is refreshed.
              </p>
            </section>
          </aside>
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          © 2026 CureWell Multispecialty Hospital · Care for a Healthier Tomorrow
        </footer>
      </main>
    </div>
  );
}
