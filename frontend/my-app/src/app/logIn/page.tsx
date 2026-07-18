"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LoginForm {
  username: string;
  userPassword: string;
}

type Status = {
  state: "idle" | "loading" | "error" | "success";
  message: string;
};

const INITIAL_FORM: LoginForm = {
  username: "",
  userPassword: "",
};

const ROLE_REDIRECTS: Record<string, string> = {
  supervisor: "/products",
  warehouse_staff: "/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>(INITIAL_FORM);
  const [status, setStatus] = useState<Status>({ state: "idle", message: "" });

  function updateField<K extends keyof LoginForm>(field: K, value: LoginForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.username || !form.userPassword) {
      setStatus({ state: "error", message: "Enter both username and password." });
      return;
    }

    setStatus({ state: "loading", message: "" });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          userPassword: form.userPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ state: "error", message: data.error || "Invalid username or password." });
        return;
      }

      localStorage.setItem("user", JSON.stringify({ ...data.user, userId: data.user.userID }));

      setStatus({ state: "success", message: data.message || "Login successful." });

      const destination = ROLE_REDIRECTS[data.user?.role] ?? "/logIn";
      router.replace(destination);
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
        className="relative w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white p-8 pb-6 shadow-[0_30px_60px_-25px_rgba(51,65,60,0.18)]"
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
            <span className="font-mono text-xs tracking-[0.08em] text-sky-600">SIGN-IN</span>
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
          Sign In
        </h1>
        <p className="mb-6 mt-1 text-[13.5px] leading-relaxed text-slate-400">
          Access the stock management system.
        </p>

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

        {/* Password */}
        <div className="mb-[18px] flex flex-col gap-2">
          <label
            htmlFor="userPassword"
            className="font-[Barlow_Condensed,sans-serif] text-[13px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Password
          </label>
          <input
            id="userPassword"
            type="password"
            placeholder="Enter your password"
            value={form.userPassword}
            onChange={(e) => updateField("userPassword", e.target.value)}
            autoComplete="current-password"
            className={inputClasses}
          />
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
          {status.state === "loading" ? "Signing in…" : "Sign in"}
        </button>

        <div className="mt-6 border-t border-dashed border-slate-200" aria-hidden="true" />
        <p className="mt-3.5 text-center text-[11.5px] text-slate-500">
          Don't have an account?{" "}
          <Link href="/registerAccount" className="text-sky-600 hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}