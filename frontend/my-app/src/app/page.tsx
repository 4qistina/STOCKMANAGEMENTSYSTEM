"use client";

import Link from "next/link";

/**
 * Fonts: this design assumes three families loaded via next/font in your
 * root layout.tsx:
 *
 *   import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
 *   const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500","600","700"], variable: "--font-display" });
 *   const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
 *   const jbMono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });
 *
 * then spread `${spaceGrotesk.variable} ${inter.variable} ${jbMono.variable}`
 * onto <html> or <body>. Fallback stacks below keep the page readable even
 * without that step.
 */

const CATALOGUE_PREVIEW = [
  { code: "SKU-2201", name: "Wireless earbuds, Gen 3", status: "Available" },
  { code: "SKU-2214", name: "65W USB-C fast charger", status: "Available" },
  { code: "SKU-2239", name: "Clear phone case, iPhone 15", status: "Not available" },
];

const ORDER_STATUS = [
  {
    label: "Pending",
    detail: "Supervisor submits a request. Awaiting warehouse approval.",
  },
  {
    label: "Approved",
    detail: "Warehouse staff confirm stock and prepare it for delivery.",
  },
  {
    label: "Delivered",
    detail: "Driver completes the handoff. Order moves to history.",
  },
];

const SUPERVISOR = [
  "Browse the product catalogue by code, brand, and category",
  "Place orders for items marked Available",
  "Track order status from Pending to Approved",
  "Review completed orders in Order History",
  "Update shop stock quantities to match real inventory",
];

const WAREHOUSE = [
  "Maintain product, category, and brand records",
  "Set each product's status to Available or Not available",
  "Approve Pending orders once items are ready",
  "Assign drivers and update delivery details",
  "Catch duplicate or missing data before it saves",
];

export default function Home() {
  return (
    <main
      className="min-h-screen w-full overflow-x-hidden text-[#0B1626]"
      style={{
        backgroundColor: "#F7F9FC",
        fontFamily: "var(--font-body, 'Inter', system-ui, sans-serif)",
      }}
    >
      {/* NAVBAR */}
      <header className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div>
            <p
              className="text-[10px] font-medium uppercase tracking-[0.3em]"
              style={{ color: "#64748B", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
            >
              Utzshop
            </p>
            <p className="text-sm font-semibold tracking-wide text-[#0F1E3D]">
              Stock Management System
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="rounded-lg border border-[#0F1E3D]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#0F1E3D] shadow-sm transition hover:border-[#2F6FED] hover:text-[#2F6FED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6FED]"
        >
          Sign in
        </Link>
      </header>

      {/* HERO */}
      <section className="mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-10">
        {/* Left */}
        <div className="flex flex-col justify-center">
          <span
            className="text-xs font-medium uppercase tracking-[0.3em]"
            style={{ color: "#2F6FED", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
          >
            Two roles · One system
          </span>

          <h1
            className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight text-[#0F1E3D] sm:text-6xl"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            Every order, tracked
            <br />
            from request to
            <br />
            <span className="text-[#2F6FED]">final handoff.</span>
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-8 text-[#334155]">
            Supervisors request the phones, chargers, and accessories their
            shop needs and follow every order in real time. Warehouse staff
            confirm stock, prepare it, and assign delivery — nothing moves
            without both sides seeing the same status.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-[#0F1E3D] px-8 py-4 text-base font-semibold text-white transition hover:bg-[#16295C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6FED]"
            >
              Sign in
            </Link>

            <Link
              href="/registerAccount"
              className="rounded-lg border-2 border-[#0F1E3D] px-8 py-4 text-base font-semibold text-[#0F1E3D] transition hover:border-[#2F6FED] hover:text-[#2F6FED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6FED]"
            >
              Register
            </Link>
          </div>
        </div>

        {/* Right — manifest-style preview */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-[#E1E7F2] bg-white p-9 shadow-[0_40px_80px_-40px_rgba(15,30,61,0.25)]">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: "#2F6FED", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
              >
                Catalogue
              </p>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#2F6FED" }} />
            </div>

            <div className="mt-5 divide-y divide-[#EEF1F7]">
              {CATALOGUE_PREVIEW.map((item) => (
                <div key={item.code} className="flex items-center justify-between py-4 first:pt-0">
                  <div>
                    <p
                      className="text-[10px] tracking-wide text-[#94A3B8]"
                      style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
                    >
                      {item.code}
                    </p>
                    <p className="text-sm font-medium text-[#0F1E3D]">{item.name}</p>
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: item.status === "Available" ? "#2F6FED" : "#94A3B8" }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-2 border-t border-[#EEF1F7] pt-6">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#94A3B8]"
                style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
              >
                Order #4471
              </p>
              <div className="mt-4 flex items-center">
                {ORDER_STATUS.map((step, i) => (
                  <div key={step.label} className="flex flex-1 items-center">
                    <div className="flex flex-1 flex-col items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: i <= 1 ? "#2F6FED" : "#DCE9FF" }}
                        aria-hidden
                      />
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: i === 1 ? "#0F1E3D" : "#94A3B8" }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i !== ORDER_STATUS.length - 1 && (
                      <span
                        className="mb-6 h-px flex-1"
                        style={{ backgroundColor: i < 1 ? "#2F6FED" : "#DCE9FF" }}
                        aria-hidden
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ORDER LIFECYCLE */}
      <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-10">
        <div className="rounded-2xl border border-[#E1E7F2] bg-white p-10">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: "#2F6FED", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
          >
            Order status
          </p>
          <h2
            className="mt-2 text-3xl font-semibold tracking-tight text-[#0F1E3D]"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            The same three stages, every time
          </h2>

          <div className="mt-9 grid gap-6 sm:grid-cols-3">
            {ORDER_STATUS.map((step, index) => (
              <div key={step.label} className="relative">
                {index !== ORDER_STATUS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute right-[-1.5rem] top-4 hidden h-px w-6 bg-[#DCE9FF] sm:block"
                  />
                )}
                <span
                  className="inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: "#EAF1FF", color: "#2F6FED" }}
                >
                  {step.label}
                </span>
                <p className="mt-3 text-sm leading-6 text-[#5B6472]">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-2">
          {[
            { title: "Supervisor", tag: "Shop-side", items: SUPERVISOR },
            { title: "Warehouse staff", tag: "Fulfilment", items: WAREHOUSE },
          ].map((role) => (
            <div
              key={role.title}
              className="rounded-2xl border border-[#E1E7F2] bg-white p-10"
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: "#2F6FED", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
              >
                {role.tag}
              </p>
              <h2
                className="mt-2 text-2xl font-semibold tracking-tight text-[#0F1E3D]"
                style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
              >
                {role.title}
              </h2>

              <ul className="mt-7 space-y-4">
                {role.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[#334155]">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: "#2F6FED" }}
                    />
                    <span className="text-sm leading-6">{item}</span>
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