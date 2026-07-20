"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
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

interface DeliveryOrder {
  orderID: number;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  submittedBy?: string | null;
  deliveryId: number | null;
  deliveryDate: string | null;
  deliveredDate: string | null;
  recipientName: string | null;
  deliveryStatus: string | null;
  driverId: number | null;
  items?: OrderItem[];
}

interface Driver {
  driverId: number;
  driverName: string;
  driverPhoneNumb: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const todayStr = () => new Date().toISOString().slice(0, 10);

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function UpdateDeliveryInformationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Clicking a row opens the order's details first; "Update Delivery
  // Information" from within that view then opens the editable form.
  const [viewing, setViewing] = useState<DeliveryOrder | null>(null);
  const [selected, setSelected] = useState<DeliveryOrder | null>(null);
  const [form, setForm] = useState({
    deliveryDate: "",
    deliveredDate: todayStr(),
    recipientName: "",
    driverId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
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

  async function loadAll() {
    setLoading(true);
    try {
      const [ordersRes, driversRes] = await Promise.all([
        fetch(`${API_BASE}/api/delivery/orders/ready`),
        fetch(`${API_BASE}/api/drivers`),
      ]);
      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      const driversData = driversRes.ok ? await driversRes.json() : [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
    } catch (err) {
      console.error("Failed to load delivery data:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checkingAuth || !user) return;
    loadAll();
  }, [checkingAuth, user]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesQuery = !q || o.orderNumber.toLowerCase().includes(q);
      const matchesDate = !dateFilter || (o.orderDate && o.orderDate.slice(0, 10) === dateFilter);
      return matchesQuery && matchesDate;
    });
  }, [orders, searchQuery, dateFilter]);

  function openDetails(order: DeliveryOrder) {
    setViewing(order);
  }

  function closeDetails() {
    setViewing(null);
  }

  function openDeliveryForm(order: DeliveryOrder) {
    setSelected(order);
    setForm({
      deliveryDate: order.deliveryDate ?? todayStr(),
      deliveredDate: order.deliveredDate ?? todayStr(),
      recipientName: order.recipientName ?? "",
      driverId: order.driverId ? String(order.driverId) : "",
    });
    setFormError(null);
  }

  function closeForm() {
    setSelected(null);
    setFormError(null);
  }

  function handleSubmit() {
    if (!form.recipientName.trim() || !form.driverId || !form.deliveryDate || !form.deliveredDate) {
      setFormError("Please fill in delivery date, delivered date, recipient name, and driver.");
      return;
    }
    setConfirmMessage(`Mark order ${selected?.orderNumber} as Delivered to "${form.recipientName}"?`);
  }

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selected.orderID,
          deliveryDate: form.deliveryDate,
          deliveredDate: form.deliveredDate,
          recipientName: form.recipientName.trim(),
          driverId: Number(form.driverId),
          deliveryStatus: "Delivered",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update delivery information");

      setSuccessMessage(`Delivery information for order ${selected.orderNumber} was updated successfully.`);
      await loadAll();
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
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
            Update Delivery Information
          </h1>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* Search & filter bar */}
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
              placeholder="Search by Order Number…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 focus:border-sky-400 focus:outline-none"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200/60 bg-white" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          // [E1: Error "No Record Found"]
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">No records available.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">No orders match your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Order Date</th>
                  <th className="px-5 py-3">Order Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.orderID}
                    onClick={() => openDetails(o)}
                    className="cursor-pointer transition hover:bg-sky-50/40"
                  >
                    <td className="px-5 py-3 font-bold text-slate-800">{o.orderNumber}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(o.orderDate)}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-emerald-700">
                        {o.orderStatus === "Available" ? "Approved" : o.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeliveryForm(o);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                      >
                        Update Delivery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              {viewing.orderNumber}
            </span>
            <h3 className="mt-1 mb-4 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Order Details
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-[13px]">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Submitted By</p>
                <p className="font-semibold text-slate-700">{viewing.submittedBy ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Order Date</p>
                <p className="font-semibold text-slate-700">{formatDate(viewing.orderDate)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Status</p>
                <p className="font-semibold text-slate-700">
                  {viewing.orderStatus === "Available" ? "Approved" : viewing.orderStatus}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Driver Assigned</p>
                <p className="font-semibold text-slate-700">{viewing.driverId ? "Yes" : "Not yet"}</p>
              </div>
            </div>

            <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(viewing.items ?? []).map((item) => (
                    <tr key={item.productId}>
                      <td className="px-3 py-2 font-medium text-slate-700">{item.productModel}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        ${Number(item.productPrice ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {(!viewing.items || viewing.items.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-slate-400">
                        No line items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeDetails}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const order = viewing;
                  closeDetails();
                  if (order) openDeliveryForm(order);
                }}
                className="flex-1 rounded-lg bg-sky-600 py-2.5 text-xs font-bold uppercase text-white transition hover:bg-sky-700"
              >
                Update Delivery Information
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              {selected.orderNumber}
            </span>
            <h3 className="mt-1 mb-4 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Delivery Details
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={form.deliveryDate}
                  onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Delivered Date
                </label>
                <input
                  type="date"
                  value={form.deliveredDate}
                  onChange={(e) => setForm({ ...form, deliveredDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Recipient Name
                </label>
                <input
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Driver
                </label>
                <select
                  value={form.driverId}
                  onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                >
                  <option value="">Select a driver…</option>
                  {drivers.map((d) => (
                    <option key={d.driverId} value={d.driverId}>
                      {d.driverName} · {d.driverPhoneNumb}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formError && <p className="mt-3 text-[12.5px] font-medium text-rose-600">{formError}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeForm}
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
                Confirm
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
              Confirm Delivery Update
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
                {submitting ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
