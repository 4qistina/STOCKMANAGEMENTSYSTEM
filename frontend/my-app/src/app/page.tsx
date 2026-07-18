"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] px-5 py-12 font-sans text-slate-700">
      <div className="relative w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-8 pb-6 shadow-[0_30px_60px_-25px_rgba(51,65,60,0.18)]">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
              System
            </span>
            <span className="font-mono text-xs tracking-[0.08em] text-sky-600">
              STOCK-MGMT
            </span>
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
          Stock Management System
        </h1>
        <p className="mb-8 mt-1 text-[13.5px] leading-relaxed text-slate-400">
          Track inventory, approvals, and stock movement in one place. Sign in
          to continue or register a new account.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/logIn"
            className="flex w-full items-center justify-center rounded-lg bg-[#1f3b57] py-3.5 font-[Barlow_Condensed,sans-serif] text-base font-bold uppercase tracking-wide text-slate-50 transition hover:bg-[#2c527a] active:translate-y-px"
          >
            Sign in
          </Link>
          <Link
            href="/registerAccount"
            className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-3.5 font-[Barlow_Condensed,sans-serif] text-base font-bold uppercase tracking-wide text-slate-700 transition hover:border-sky-300 hover:bg-sky-400/10 active:translate-y-px"
          >
            Register account
          </Link>
        </div>

        <div className="mt-6 border-t border-dashed border-slate-200" aria-hidden="true" />
        <p className="mt-3.5 text-center text-[11.5px] text-slate-500">
          Access is limited to registered supervisors and warehouse staff.
        </p>
      </div>
    </div>
  );
}