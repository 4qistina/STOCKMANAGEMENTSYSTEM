"use client";

import Link from "next/link";

/**
 * Fonts: this design assumes three families loaded via next/font in your
 * root layout.tsx:
 *
 *   import { Oswald, Inter, IBM_Plex_Mono } from "next/font/google";
 *   const oswald = Oswald({ subsets: ["latin"], variable: "--font-display" });
 *   const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
 *   const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });
 *
 * then spread `${oswald.variable} ${inter.variable} ${plexMono.variable}`
 * onto <html> or <body>. Fallback stacks below keep the page readable even
 * without that step.
 */

const LIFECYCLE = [
  {
    code: "01 · REQUEST",
    label: "Pending",
    note: "Supervisor requests stock",
  },
  {
    code: "02 · CONFIRM",
    label: "Available",
    note: "Warehouse confirms & prepares",
  },
  {
    code: "03 · HANDOFF",
    label: "Delivered",
    note: "Driver hands it off",
  },
];

const SUPERVISOR = [
  "Browse product catalogue",
  "Place stock requests",
  "Track order status",
];

const WAREHOUSE = [
  "Maintain product catalogue",
  "Approve & fulfil orders",
  "Assign deliveries",
];

export default function Home() {
  return (
    <main
      className="relative min-h-screen overflow-hidden text-[#111111]"
      style={{
        backgroundColor: "#F5F7FB",
        backgroundImage:
          "radial-gradient(circle, #E2E7F2 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        fontFamily: "var(--font-body, 'Inter', system-ui, sans-serif)",
      }}
    >
      {/* NAVBAR */}
      <header className="relative mx-auto flex h-24 max-w-7xl items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-sm"
            style={{ backgroundColor: "#14213D" }}
          >
            <div
              className="h-4 w-4"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg,#2F6FED 0px,#2F6FED 1px,transparent 1px,transparent 3px)",
              }}
            />
          </div>
          <div>
            <p
              className="text-[11px] font-medium uppercase tracking-[0.3em]"
              style={{
                color: "#5B6472",
                fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
              }}
            >
              Utzshop
            </p>
            <p className="text-sm font-semibold tracking-wide text-[#14213D]">
              Warehouse Stock Management
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="rounded-sm border border-dashed border-[#14213D]/30 bg-white px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-[#14213D] shadow-sm transition hover:-translate-y-0.5 hover:border-[#2F6FED] hover:text-[#2F6FED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6FED]"
        >
          Sign in
        </Link>
      </header>

      {/* HERO */}
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-10 lg:py-24">
        {/* Left */}
        <div className="flex flex-col justify-center">
          <span
            className="text-xs font-medium uppercase tracking-[0.3em]"
            style={{
              color: "#2F6FED",
              fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
            }}
          >
            Manifest No. 2026-014
          </span>

          <h1
            className="mt-5 text-6xl font-bold uppercase leading-[0.95] tracking-tight text-[#14213D] sm:text-7xl"
            style={{
              fontFamily: "var(--font-display, 'Oswald', sans-serif)",
            }}
          >
            Request it.
            <br />
            Stock it.
            <br />
            <span className="relative inline-block">
              Deliver it.
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-3 w-full -z-10"
                style={{ backgroundColor: "#DCE9FF" }}
              />
            </span>
          </h1>

          <p className="mt-8 max-w-lg text-lg leading-8 text-[#333333]">
            One connected platform where supervisors request stock,
            warehouse staff fulfil orders, and every delivery stays visible
            from first request to final handoff.
          </p>

          <div className="mt-11 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-sm bg-[#14213D] px-8 py-4 text-base font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-[#1D2E52] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6FED]"
            >
              Sign in
            </Link>

            <Link
              href="/registerAccount"
              className="rounded-sm border-2 border-[#14213D] px-8 py-4 text-base font-bold uppercase tracking-wide text-[#14213D] transition hover:-translate-y-0.5 hover:border-[#2F6FED] hover:text-[#2F6FED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6FED]"
            >
              Register
            </Link>
          </div>

          <div
            className="mt-14 flex items-center gap-6 text-xs font-medium uppercase tracking-[0.2em] text-[#5B6472]"
            style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)" }}
          >
            <span>Two roles</span>
            <span className="h-1 w-1 rounded-full bg-[#C7CEDC]" />
            <span>Three stages</span>
            <span className="h-1 w-1 rounded-full bg-[#C7CEDC]" />
            <span>Full visibility</span>
          </div>
        </div>

        {/* Right — shipping tag card */}
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-md -rotate-1 rounded-md border border-[#DCE1EC] bg-white p-9 shadow-[0_25px_60px_-25px_rgba(20,33,61,0.35)] transition hover:rotate-0">
            {/* punch hole */}
            <div
              aria-hidden
              className="absolute -top-4 left-9 h-8 w-8 rounded-full border-4 border-[#F5F7FB] bg-[#F5F7FB] shadow-inner"
            />
            {/* perforated top edge */}
            <div
              aria-hidden
              className="absolute -top-[1px] left-0 h-2 w-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #F5F7FB 3px, transparent 3px)",
                backgroundSize: "14px 14px",
                backgroundPosition: "0 -6px",
              }}
            />

            <p
              className="text-[11px] font-semibold uppercase tracking-[0.3em]"
              style={{
                color: "#2F6FED",
                fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
              }}
            >
              Tracking tag
            </p>
            <h2
              className="mt-1 text-3xl font-bold uppercase tracking-tight text-[#14213D]"
              style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
            >
              Order lifecycle
            </h2>

            <div className="mt-8 space-y-0">
              {LIFECYCLE.map((item, index) => (
                <div key={item.label} className="relative flex gap-5 pb-8 last:pb-0">
                  {index !== LIFECYCLE.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[19px] top-10 h-[calc(100%-1rem)] w-px border-l border-dashed border-[#DCE1EC]"
                    />
                  )}
                  <div
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 text-sm font-bold"
                    style={{
                      borderColor: "#14213D",
                      color: "#14213D",
                      fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
                    }}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                      style={{
                        color: "#2F6FED",
                        fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
                      }}
                    >
                      {item.code}
                    </p>
                    <h3 className="font-semibold text-[#14213D]">{item.label}</h3>
                    <p className="text-sm text-[#5B6472]">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="relative mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-2">
          {[
            { title: "Supervisor", tag: "ROLE — 01", items: SUPERVISOR },
            { title: "Warehouse staff", tag: "ROLE — 02", items: WAREHOUSE },
          ].map((role) => (
            <div
              key={role.title}
              className="relative rounded-md border border-[#DCE1EC] bg-white/80 p-10 pt-12"
            >
              {/* folder tab */}
              <div
                className="absolute -top-4 left-9 rounded-sm px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white"
                style={{
                  backgroundColor: "#2F6FED",
                  fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
                }}
              >
                {role.tag}
              </div>

              <h2
                className="text-3xl font-bold uppercase tracking-tight text-[#14213D]"
                style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
              >
                {role.title}
              </h2>

              <ul className="mt-8 space-y-4">
                {role.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[#111111]">
                    <span
                      aria-hidden
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 border-[#14213D]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}