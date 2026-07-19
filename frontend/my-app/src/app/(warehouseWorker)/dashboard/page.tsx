"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  userFullname: string;
  username: string;
  role: string;
}

export default function WarehouseStaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (!stored) {
      router.replace("/login");
      return;
    }

    const parsed: User = JSON.parse(stored);

    if (parsed.role !== "warehouse_staff") {
      router.replace("/login");
      return;
    }

    setUser(parsed);
    setChecking(false);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("user");
    router.replace("/login");
  }

  if (checking || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
        Checking access…
      </div>
    );
  }

  const stats = [
    { label: "Orders to Pack", value: "14" },
    { label: "Stock Movements Today", value: "37" },
    { label: "Low Stock Alerts", value: "9" },
    { label: "Deliveries Pending", value: "5" },
  ];

  const quickActions = [
    { title: "Maintain Product", desc: "Add, edit, or remove product listings", href: "/warehouse/maintain-products" },
    { title: "Manage Product Category", desc: "Add, edit, or remove product categories", href: "/warehouse/categories" },
    { title: "Manage Product Brand", desc: "Add, edit, or remove product brands", href: "/warehouse/brands" },
    { title: "Order Details & Status", desc: "View orders, update status, and see order history", href: "/warehouse/orders" },
    { title: "Manage Driver Information", desc: "Add, edit, or remove delivery drivers", href: "/warehouse/drivers" },
    { title: "Update Delivery Information", desc: "Assign a driver and confirm delivery", href: "/warehouse/delivery" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] px-6 py-8 font-sans text-slate-700">
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              Warehouse Staff Dashboard
            </span>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-2xl font-bold uppercase tracking-wide text-slate-800">
              Welcome, {user.userFullname}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
          >
            Log out
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.25)]"
            >
              <p className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold text-slate-800">
                {s.value}
              </p>
              <p className="mt-1 text-[12.5px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <h2 className="mb-3 font-[Barlow_Condensed,sans-serif] text-sm font-semibold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:bg-sky-50"
            >
              <p className="font-[Barlow_Condensed,sans-serif] text-base font-semibold text-slate-800">
                {a.title}
              </p>
              <p className="mt-1 text-[12.5px] text-slate-400">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}