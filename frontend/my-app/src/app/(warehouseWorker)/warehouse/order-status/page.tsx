"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  userFullname: string;
  username: string;
  role: string;
}

interface Order {
  orderID: number;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const STATUS_OPTIONS = ["Pending", "Available", "Not Available"];

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function UpdateOrderStatusPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      const parsed: User = JSON.parse(stored);
      if (parsed.role !== "warehouse_staff") {
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

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/order-status/list`);
      const data = res.ok ? await res.json() : [];
      // Business rule: only Warehouse Staff need to act on pending requests here.
      const pending = (Array.isArray(data) ? data : []).filter((o: Order) => o.orderStatus === "Pending");
      setOrders(pending);
    } catch (err) {
      console.error("Failed to load order status list:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checkingAuth || !user) return;
    loadOrders();
  }, [checkingAuth, user]);

  function openStatusForm(order: Order) {
    setSelected(order);
    setNextStatus(order.orderStatus);
  }

  function handleSubmit() {
    if (!selected || !nextStatus) return;
    // Business rule: once Approved (Available), no further action can be performed
    setConfirmMessage(
      `Once the status is set to Approved, no further actions can be performed on this request. Continue?`
    );
  }

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/order-status/${selected.orderID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order status");

      setSuccessMessage(`Order ${selected.orderNumber} updated to "${nextStatus}".`);
      await loadOrders();
      setSelected(null);
    } catch (err) {
      console.error("Failed to update order status:", err);
    } finally {
      setSubmitting(false);
      setConfirmMessage(null);
    }
  }

  if (checkingAuth || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] px-5 py-8 sm:px-8 font-sans text-slate-700">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
            WAREHOUSE STAFF
          </span>
          <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
            Update Order Status
          </h1>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200/60 bg-white" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          // [E1: No Pending Requests Found]
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">
              No pending order requests available for update.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Order Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.orderID} className="transition hover:bg-sky-50/40">
                    <td className="px-5 py-3 font-bold text-slate-800">{o.orderNumber}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(o.orderDate)}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-amber-700">
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openStatusForm(o)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              {selected.orderNumber}
            </span>
            <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Update Order Status
            </h3>

            <label className="mt-4 mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              New Status
            </label>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setSelected(null)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-lg bg-sky-600 py-2.5 text-xs font-bold uppercase text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">Confirmation</span>
            <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Confirm Update
            </h3>
            <p className="mt-2 text-sm text-slate-500">{confirmMessage}</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmMessage(null)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-lg bg-sky-600 py-2.5 text-xs font-bold uppercase text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? "Updating…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
