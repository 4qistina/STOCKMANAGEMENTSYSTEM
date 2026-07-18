"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type Role = "supervisor" | "warehouse_staff" | "";

interface RegisterForm {
  userFullname: string;
  username: string;
  userPassword: string;
  confirmPassword: string;
  role: Role;
}

type Status = {
  state: "idle" | "loading" | "error" | "success";
  message: string;
};

const ROLES: { value: Role; label: string; hint: string }[] = [
  {
    value: "supervisor",
    label: "Supervisor",
    hint: "Full access · approvals & reports",
  },
  {
    value: "warehouse_staff",
    label: "Warehouse Staff",
    hint: "Floor access · stock in/out",
  },
];

const INITIAL_FORM: RegisterForm = {
  userFullname: "",
  username: "",
  userPassword: "",
  confirmPassword: "",
  role: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [status, setStatus] = useState<Status>({ state: "idle", message: "" });

  function updateField<K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.userFullname || !form.username || !form.userPassword || !form.role) {
      setStatus({ state: "error", message: "Fill in every field before submitting." });
      return;
    }
    if (form.userPassword.length < 8) {
      setStatus({ state: "error", message: "Password needs at least 8 characters." });
      return;
    }
    if (form.userPassword !== form.confirmPassword) {
      setStatus({ state: "error", message: "Passwords don't match." });
      return;
    }

    setStatus({ state: "loading", message: "" });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userFullname: form.userFullname,
          username: form.username,
          userPassword: form.userPassword,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ state: "error", message: data.error || "Registration failed." });
        return;
      }

      setStatus({ state: "success", message: "Account created. You can sign in now." });
      setForm(INITIAL_FORM);
    } catch (err) {
      setStatus({ state: "error", message: "Couldn't reach the server. Try again." });
    }
  }

  const inputClasses =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[14.5px] text-slate-700 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-400/15";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] px-5 py-12 font-sans text-slate-700">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-8 pb-6 shadow-[0_30px_60px_-25px_rgba(51,65,60,0.18)]"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 transition hover:text-sky-600"
            >
              ← Back to home
            </Link>
            <span className="font-mono text-xs tracking-[0.08em] text-sky-600">NEW-ACCT</span>
          </div>
          <div className="flex h-[26px] items-end gap-[2px] opacity-50" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className="h-full bg-slate-400"
                style={{ width: i % 5 === 0 ? "3px" : "1px" }}
              />
            ))}
          </div>
        </div>

        <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
          Create Account
        </h1>
        <p className="mb-6 mt-1 text-[13.5px] leading-relaxed text-slate-400">
          Register a new user for the stock management system.
        </p>

        {/* Full name */}
        <div className="mb-[18px] flex flex-col gap-2">
          <label
            htmlFor="userFullname"
            className="font-[Barlow_Condensed,sans-serif] text-[13px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Full name
          </label>
          <input
            id="userFullname"
            type="text"
            placeholder="e.g. Nur Aisyah Rahman"
            value={form.userFullname}
            onChange={(e) => updateField("userFullname", e.target.value)}
            autoComplete="name"
            className={inputClasses}
          />
        </div>

        {/* Username */}
        <div className="mb-[18px] flex flex-col gap-2">
          <label
            htmlFor="username"
            className="font-[Barlow_Condensed,sans-serif] text-[13px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="e.g. aisyah.r"
            value={form.username}
            onChange={(e) => updateField("username", e.target.value.trim())}
            autoComplete="username"
            className={`${inputClasses} font-mono text-[13.5px]`}
          />
        </div>

        {/* Password row */}
        <div className="mb-[18px] grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="userPassword"
              className="font-[Barlow_Condensed,sans-serif] text-[13px] font-semibold uppercase tracking-wider text-slate-400"
            >
              Password
            </label>
            <input
              id="userPassword"
              type="password"
              placeholder="Min. 8 characters"
              value={form.userPassword}
              onChange={(e) => updateField("userPassword", e.target.value)}
              autoComplete="new-password"
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirmPassword"
              className="font-[Barlow_Condensed,sans-serif] text-[13px] font-semibold uppercase tracking-wider text-slate-400"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              autoComplete="new-password"
              className={inputClasses}
            />
          </div>
        </div>

        {/* Role */}
        <div className="mb-[18px] flex flex-col gap-2">
          <span className="font-[Barlow_Condensed,sans-serif] text-[13px] font-semibold uppercase tracking-wider text-slate-400">
            Role
          </span>
          <div className="mt-0.5 grid grid-cols-2 gap-2.5">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`relative flex cursor-pointer flex-col gap-1 rounded-lg border p-3 pb-2.5 transition ${
                  form.role === r.value
                    ? "border-sky-400 bg-sky-400/10"
                    : "border-slate-200 bg-slate-50 hover:border-sky-200"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={form.role === r.value}
                  onChange={(e) => updateField("role", e.target.value as Role)}
                  className="absolute right-3 top-3 h-[15px] w-[15px] accent-sky-500"
                />
                <span className="pr-4.5 font-[Barlow_Condensed,sans-serif] text-[15.5px] font-semibold text-slate-800">
                  {r.label}
                </span>
                <span className="text-[11.5px] leading-snug text-slate-400">{r.hint}</span>
              </label>
            ))}
          </div>
        </div>

        {status.state === "error" && (
          <p className="mb-[18px] mt-1 rounded-md border border-orange-300/40 bg-orange-400/10 px-3 py-2 text-[13px] text-orange-700">
            {status.message}
          </p>
        )}
        {status.state === "success" && (
          <p className="mb-[18px] mt-1 rounded-md border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-[13px] text-sky-700">
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={status.state === "loading"}
          className="mt-1 w-full rounded-lg bg-[#1f3b57] py-3.5 font-[Barlow_Condensed,sans-serif] text-base font-bold uppercase tracking-wide text-slate-50 transition hover:bg-[#2c527a] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status.state === "loading" ? "Registering…" : "Register account"}
        </button>

        <div className="mt-6 border-t border-dashed border-slate-200" aria-hidden="true" />
        <p className="mt-3.5 text-center text-[11.5px] text-slate-500">
          Already have an account?{" "}
          <Link href="/logIn" className="text-sky-600 hover:underline">
            Sign in here
          </Link>
        </p>
      </form>
    </div>
  );
}