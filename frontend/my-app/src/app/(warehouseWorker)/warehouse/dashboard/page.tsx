"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthGuard } from "@/src/lib/useAuthGuard";
import { formatDate, toDateOnly } from "@/src/lib/format";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Order {
  orderID: number;
  orderNumber: string;
  orderDate: string;
  orderStatus: string; // "Pending" | "Available" (Available == Approved)
  deliveredDate: string | null;
  driverId: number | null;
}

interface Driver {
  driverId: number;
  driverName: string;
}

// "Available" is the value stored in the DB for an approved order — see the
// same convention on the Order Details & Status page.
function isPending(order: Order) {
  return order.orderStatus?.trim().toLowerCase() === "pending";
}

export default function WarehouseStaffDashboard() {
  const user = useAuthGuard("warehouse_staff");

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [readyForDelivery, setReadyForDelivery] = useState<Order[]>([]);
  const [driverCount, setDriverCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Everything here is fetched live — Maintain Product / Categories / Brands,
  // Order Details & Status, and Manage Driver / Delivery all already hit
  // these same endpoints, so the dashboard stays in sync with them.
  // Note: stock levels are deliberately NOT shown here — that's the
  // Supervisor's job on their own dashboard. Warehouse Staff work with
  // orders, fulfilment, and drivers, not inventory counts.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [activeRes, historyRes, readyRes, driversRes] = await Promise.all([
          fetch(`${API_BASE}/api/orders/active`),
          fetch(`${API_BASE}/api/orders/history`),
          fetch(`${API_BASE}/api/delivery/orders/ready`),
          fetch(`${API_BASE}/api/drivers`),
        ]);
        if (!activeRes.ok || !historyRes.ok || !readyRes.ok || !driversRes.ok) {
          throw new Error("Failed to load dashboard data");
        }
        const [active, history, ready, drivers]: [Order[], Order[], Order[], Driver[]] = await Promise.all([
          activeRes.json(),
          historyRes.json(),
          readyRes.json(),
          driversRes.json(),
        ]);

        if (cancelled) return;

        const merged = new Map<number, Order>();
        [...active, ...history].forEach((o) => merged.set(o.orderID, o));

        setOrders(Array.from(merged.values()));
        setReadyForDelivery(ready);
        setDriverCount(drivers.length);
      } catch (err) {
        if (!cancelled) {
          setError("Couldn't load live dashboard data. Please refresh.");
          console.error("Dashboard load failed:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ---- Derived analytics — all computed from real API data ----
  const pending = useMemo(
    () => (orders ?? []).filter((o) => !o.deliveredDate && isPending(o)),
    [orders]
  );
  const approvedActive = useMemo(
    () => (orders ?? []).filter((o) => !o.deliveredDate && !isPending(o)),
    [orders]
  );
  const delivered = useMemo(() => (orders ?? []).filter((o) => !!o.deliveredDate), [orders]);

  // Orders placed per day for the last 7 calendar days, across all Supervisors.
  const dailyOrderVolume = useMemo(() => {
    const days: { label: string; date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.toISOString().slice(0, 10),
        count: 0,
      });
    }
    (orders ?? []).forEach((o) => {
      const iso = toDateOnly(o.orderDate);
      const bucket = days.find((d) => d.date === iso);
      if (bucket) bucket.count += 1;
    });
    return days;
  }, [orders]);

  const deliveredThisWeek = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    return delivered.filter((o) => toDateOnly(o.deliveredDate) >= cutoffIso).length;
  }, [delivered]);

  // Approved orders that are ready to go out but have nobody assigned yet —
  // exactly what "Update Delivery Information" needs actioned next.
  const needsDriver = useMemo(
    () =>
      [...readyForDelivery]
        .filter((o) => !o.driverId)
        .sort((a, b) => toDateOnly(a.orderDate).localeCompare(toDateOnly(b.orderDate)))
        .slice(0, 6),
    [readyForDelivery]
  );

  const maxDailyCount = Math.max(1, ...dailyOrderVolume.map((d) => d.count));
  const pipelineTotal = Math.max(1, pending.length + approvedActive.length + delivered.length);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
        Checking access…
      </div>
    );
  }

  const stats = [
    { label: "Orders to Pack", value: loading ? "—" : String(pending.length) },
    { label: "Awaiting Delivery", value: loading ? "—" : String(readyForDelivery.length) },
    { label: "Delivered This Week", value: loading ? "—" : String(deliveredThisWeek) },
    { label: "Active Drivers", value: loading ? "—" : String(driverCount) },
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
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-3 text-[12.5px] font-medium text-rose-600">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.25)]"
            >
              <p className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold text-slate-800">{s.value}</p>
              <p className="mt-1 text-[12.5px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Insights */}
        <h2 className="mb-3 font-[Barlow_Condensed,sans-serif] text-sm font-semibold uppercase tracking-wider text-slate-400">
          Insights
        </h2>
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center text-[12.5px] text-slate-400 lg:col-span-2">
              Loading live dashboard data…
            </div>
          ) : (
            <>
              {/* Order pipeline */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.25)]">
                <p className="font-[Barlow_Condensed,sans-serif] text-base font-semibold text-slate-800">
                  Order Pipeline
                </p>
                <p className="mb-4 text-[12.5px] text-slate-400">Where every order stands right now</p>
                <div className="space-y-3">
                  {[
                    { label: "Pending", value: pending.length, color: "bg-amber-400" },
                    { label: "Approved · Awaiting Delivery", value: approvedActive.length, color: "bg-sky-500" },
                    { label: "Delivered", value: delivered.length, color: "bg-slate-700" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="mb-1 flex items-center justify-between text-[12.5px]">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="font-semibold text-slate-700">{row.value}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${row.color}`}
                          style={{ width: `${Math.max(2, (row.value / pipelineTotal) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-day order volume */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.25)]">
                <p className="font-[Barlow_Condensed,sans-serif] text-base font-semibold text-slate-800">
                  Order Volume — Last 7 Days
                </p>
                <p className="mb-4 text-[12.5px] text-slate-400">Orders placed each day, all Supervisors</p>
                <div className="flex h-32 items-end gap-2">
                  {dailyOrderVolume.map((d) => (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="flex h-24 w-full items-end">
                        <div
                          className="w-full rounded-t-md bg-sky-500/90"
                          style={{ height: `${Math.max(4, (d.count / maxDailyCount) * 100)}%` }}
                          title={`${d.count} order${d.count === 1 ? "" : "s"} on ${d.date}`}
                        />
                      </div>
                      <span className="text-[10.5px] text-slate-400">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Needs a driver */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.25)] lg:col-span-2">
                <p className="font-[Barlow_Condensed,sans-serif] text-base font-semibold text-slate-800">
                  Needs a Driver
                </p>
                <p className="mb-4 text-[12.5px] text-slate-400">
                  Approved orders ready to go out with no driver assigned yet, oldest first
                </p>
                {needsDriver.length === 0 ? (
                  <p className="text-[12.5px] text-slate-400">Every approved order already has a driver assigned.</p>
                ) : (
                  <ul className="space-y-2">
                    {needsDriver.map((o) => (
                      <li
                        key={o.orderID}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <span className="text-[12.5px] font-medium text-slate-700">{o.orderNumber}</span>
                        </div>
                        <span className="text-[12px] font-semibold text-slate-500">{formatDate(o.orderDate)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/warehouse/delivery"
                  className="mt-3 inline-block text-[12px] font-semibold text-sky-600 hover:underline"
                >
                  Assign drivers →
                </Link>
              </div>
            </>
          )}
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
              <p className="font-[Barlow_Condensed,sans-serif] text-base font-semibold text-slate-800">{a.title}</p>
              <p className="mt-1 text-[12.5px] text-slate-400">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}