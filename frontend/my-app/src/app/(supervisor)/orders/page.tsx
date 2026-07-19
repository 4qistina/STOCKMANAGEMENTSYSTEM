"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/app/components/Navbar";

interface User {
  userId: number;
  userFullname: string;
  username: string;
  role: string;
}

interface OrderItem {
  productId: number;
  productModel: string;
  productCode: string;
  productPrice: number;
  categoryName: string | null;
  brandName: string | null;
  quantity: number;
}

interface Order {
  orderID: number;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  deliveryId: number | null;
  items: OrderItem[];
  deliveryDate: string | null;
  deliveredDate: string | null;
  recipientName: string | null;
  deliveryStatus: string | null;
  driverId: number | null;
  driverName: string | null;
  driverPhoneNumb: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type Tab = "current" | "history";

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function orderTotal(items: OrderItem[]) {
  return items.reduce((sum, i) => sum + Number(i.productPrice ?? 0) * i.quantity, 0);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Available: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return (
    <span
      className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
        styles[status] ?? "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

function OrderCard({ order, index, showDelivery }: { order: Order; index: number; showDelivery: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)] sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-500">
            {index + 1}
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-slate-400">Order Number</p>
            <p className="font-[Barlow_Condensed,sans-serif] text-lg font-bold text-slate-800">{order.orderNumber}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-slate-400">Order Date</p>
          <p className="text-sm font-semibold text-slate-600">{formatDate(order.orderDate)}</p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>

      {/* Items */}
      <div className="mt-4 flex flex-col divide-y divide-slate-100">
        {order.items.map((item, itemIndex) => (
          <div key={item.productId} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 font-mono text-[10px] font-bold text-slate-400">
                {itemIndex + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-slate-400">
                  {item.categoryName && (
                    <>
                      <span className="uppercase tracking-wide text-slate-500">{item.categoryName}</span>
                      <span>•</span>
                    </>
                  )}
                  <span className="uppercase font-semibold text-sky-600">{item.brandName ?? "Generic"}</span>
                </div>
                <p className="truncate text-[14px] font-bold text-slate-800">{item.productModel}</p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-6 text-right">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Price per unit</p>
                <p className="text-sm font-semibold text-slate-700">${Number(item.productPrice ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Qty</p>
                <p className="text-sm font-semibold text-slate-700">{item.quantity}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Subtotal</p>
                <p className="text-sm font-bold text-slate-900">
                  ${(Number(item.productPrice ?? 0) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order total */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Order Total</span>
        <span className="text-base font-bold text-slate-900">${orderTotal(order.items).toFixed(2)}</span>
      </div>

      {/* Delivery details (Order History only) */}
      {showDelivery && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-400">Delivery Details</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Delivery Date</p>
              <p className="text-[13px] font-semibold text-slate-700">{formatDate(order.deliveryDate)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Delivered Date</p>
              <p className="text-[13px] font-semibold text-slate-700">{formatDate(order.deliveredDate)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Recipient</p>
              <p className="text-[13px] font-semibold text-slate-700">{order.recipientName ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Driver</p>
              <p className="text-[13px] font-semibold text-slate-700">
                {order.driverName ?? "—"}
                {order.driverPhoneNumb ? ` · ${order.driverPhoneNumb}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [tab, setTab] = useState<Tab>("current");
  const [currentOrders, setCurrentOrders] = useState<Order[] | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Search / filter state (Order ID, Order Number, Order Date) ---
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // --- Auth Verification ---
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      const parsed: User = JSON.parse(stored);
      if (parsed.role !== "supervisor") {
        router.replace("/login");
        return;
      }
      setUser(parsed);
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
      router.replace("/login");
    } finally {
      setCheckingAuth(false);
    }
  }, [router]);

  // --- Fetch orders for the active tab (cached after first load) ---
  useEffect(() => {
    if (checkingAuth || !user?.userId) return;

    const alreadyLoaded = tab === "current" ? currentOrders !== null : historyOrders !== null;
    if (alreadyLoaded) return;

    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        const endpoint =
          tab === "current"
            ? `${API_BASE}/api/orders/active/${user!.userId}`
            : `${API_BASE}/api/orders/history/${user!.userId}`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Failed to load orders");
        const data: Order[] = await res.json();
        if (cancelled) return;
        if (tab === "current") setCurrentOrders(data);
        else setHistoryOrders(data);
      } catch (err) {
        if (!cancelled) setError("Couldn't load your orders. Please try again.");
        console.error("Failed to fetch orders:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [checkingAuth, user, tab, currentOrders, historyOrders]);

  const orders = tab === "current" ? currentOrders : historyOrders;

  const filteredOrders = useMemo(() => {
    if (!orders) return orders;
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesQuery =
        !q || o.orderNumber?.toLowerCase().includes(q) || String(o.orderID).includes(q);
      const matchesDate = !dateFilter || (o.orderDate && o.orderDate.slice(0, 10) === dateFilter);
      return matchesQuery && matchesDate;
    });
  }, [orders, searchQuery, dateFilter]);

  const hasActiveFilters = !!(searchQuery || dateFilter);

  function clearFilters() {
    setSearchQuery("");
    setDateFilter("");
  }

  if (checkingAuth || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] font-sans text-slate-700">
      <Navbar />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
            STOCK MANAGEMENT SYSTEM
          </span>
          <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
            My Orders
          </h1>
        </div>

        {/* Tabs (A1 / A2) */}
        <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("current")}
            className={`rounded-full px-5 py-2 font-[Barlow_Condensed,sans-serif] text-[14px] font-semibold uppercase tracking-wide transition ${
              tab === "current" ? "bg-[#1f3b57] text-slate-50" : "text-slate-500 hover:text-sky-700"
            }`}
          >
            Current Orders
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`rounded-full px-5 py-2 font-[Barlow_Condensed,sans-serif] text-[14px] font-semibold uppercase tracking-wide transition ${
              tab === "history" ? "bg-[#1f3b57] text-slate-50" : "text-slate-500 hover:text-sky-700"
            }`}
          >
            Order History
          </button>
        </div>

        {/* Search & filter bar: Order ID / Order Number / Order Date */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID or Order Number…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 focus:border-sky-400 focus:outline-none"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-rose-600 transition hover:border-rose-300"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-200/60 bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-rose-600">{error}</p>
          </div>
        ) : !filteredOrders || filteredOrders.length === 0 ? (
          // [E1: Error "No Record Found"]
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="mx-auto h-12 w-12 text-slate-300 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H5.25a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 5.25 4.5h9.879a1.5 1.5 0 0 1 1.06.44l4.622 4.62a1.5 1.5 0 0 1 .44 1.061V16.5a2.25 2.25 0 0 1-2.25 2.25Z"
              />
            </svg>
            <h3 className="font-[Barlow_Condensed,sans-serif] text-lg font-bold uppercase text-slate-700">
              No records available.
            </h3>
            <p className="mt-1 text-[13px] text-slate-400">
              {hasActiveFilters
                ? "No orders match your search or filters."
                : tab === "current"
                ? "You have no pending or in-progress orders right now."
                : "You don't have any delivered orders yet."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-sky-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-800 transition hover:bg-sky-200"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                href="/products"
                className="mt-4 rounded-lg bg-sky-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-800 transition hover:bg-sky-200"
              >
                Browse Products
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map((order, index) => (
              <OrderCard key={order.orderID} order={order} index={index} showDelivery={tab === "history"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
