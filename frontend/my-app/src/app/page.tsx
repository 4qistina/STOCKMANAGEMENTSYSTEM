"use client";

import Link from "next/link";

const LIFECYCLE = [
  {
    label: "Pending",
    note: "Supervisor requests stock",
  },
  {
    label: "Available",
    note: "Warehouse confirms & prepares",
  },
  {
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
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] text-slate-700">

            {/* decorative barcode */}
            <div
                className="absolute right-0 top-0 hidden h-full w-52 opacity-5 lg:block"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(90deg,#1f3b57 0px,#1f3b57 2px,transparent 2px,transparent 6px,#1f3b57 6px,#1f3b57 7px,transparent 7px,transparent 14px)",
                }}
            />

            {/* NAVBAR */}

            <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

                <div>
                    <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-400">
                        Utzshop
                    </p>

                    <p className="font-semibold text-slate-700">
                        Warehouse Stock Management
                    </p>
                </div>

                <Link
                    href="/login"
                    className="rounded-lg border border-slate-200 bg-white px-6 py-2 font-semibold shadow-sm transition hover:border-sky-300"
                >
                    Sign In
                </Link>

            </header>

            {/* HERO */}

            <section className="mx-auto grid min-h-[75vh] max-w-7xl grid-cols-1 gap-16 px-8 py-20 lg:grid-cols-2">

                {/* Left */}

                <div className="flex flex-col justify-center">

                    <span className="font-mono text-xs uppercase tracking-[0.25em] text-slate-400">
                        Inventory Workflow
                    </span>

                    <h1 className="mt-4 font-[Barlow_Condensed,sans-serif] text-7xl font-bold uppercase leading-none text-slate-800">

                        Request it.
                        <br />
                        Stock it.
                        <br />
                        <span className="text-sky-600">
                            Deliver it.
                        </span>

                    </h1>

                    <p className="mt-8 max-w-xl text-lg leading-8 text-slate-500">

                        One connected platform where supervisors request stock,
                        warehouse staff fulfil orders, and every delivery remains
                        visible from start to finish.

                    </p>

                    <div className="mt-12 flex gap-4">

                        <Link
                            href="/login"
                            className="rounded-lg bg-[#1f3b57] px-8 py-4 font-[Barlow_Condensed] text-lg font-bold uppercase tracking-wide text-white hover:bg-[#294d72]"
                        >
                            Sign In
                        </Link>

                        <Link
                            href="/registerAccount"
                            className="rounded-lg border border-slate-300 bg-white px-8 py-4 font-[Barlow_Condensed] text-lg font-bold uppercase tracking-wide hover:border-sky-300"
                        >
                            Register
                        </Link>

                    </div>

                </div>

                {/* Right */}

                <div className="flex items-center justify-center">

                    <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl">

                        <h2 className="font-[Barlow_Condensed] text-3xl font-bold uppercase">
                            Order Lifecycle
                        </h2>

                        <div className="mt-10 space-y-6">

                            {LIFECYCLE.map((item, index) => (

                                <div
                                    key={item.label}
                                    className="flex items-center"
                                >

                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-600">
                                        {index + 1}
                                    </div>

                                    <div className="ml-5">

                                        <h3 className="font-semibold">
                                            {item.label}
                                        </h3>

                                        <p className="text-sm text-slate-500">
                                            {item.note}
                                        </p>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                </div>

            </section>

            {/* FEATURES */}

            <section className="mx-auto max-w-7xl px-8 pb-24">

                <div className="grid gap-8 lg:grid-cols-2">

                    <div className="rounded-3xl border border-slate-200 bg-white/70 p-10">

                        <h2 className="font-[Barlow_Condensed] text-3xl font-bold uppercase">
                            Supervisor
                        </h2>

                        <ul className="mt-8 space-y-4">

                            {SUPERVISOR.map((item) => (

                                <li key={item} className="flex items-center gap-3">

                                    <div className="h-2 w-2 rounded-full bg-sky-500"/>

                                    {item}

                                </li>

                            ))}

                        </ul>

                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white/70 p-10">

                        <h2 className="font-[Barlow_Condensed] text-3xl font-bold uppercase">
                            Warehouse Staff
                        </h2>

                        <ul className="mt-8 space-y-4">

                            {WAREHOUSE.map((item) => (

                                <li key={item} className="flex items-center gap-3">

                                    <div className="h-2 w-2 rounded-full bg-sky-500"/>

                                    {item}

                                </li>

                            ))}

                        </ul>

                    </div>

                </div>

            </section>

        </main>
    );
}