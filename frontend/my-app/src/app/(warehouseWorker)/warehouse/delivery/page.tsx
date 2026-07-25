"use client";

import { useEffect, useMemo, useState } from "react";
import Pagination, { paginate } from "@/src/app/components/Pagination";
import { formatCurrency, formatDate, toDateOnly } from "@/src/lib/format";
import { useAuthGuard } from "@/src/lib/useAuthGuard";

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
  driverName?: string | null;
  items?: OrderItem[];
}

interface Driver {
  driverId: number;
  driverName: string;
  driverPhoneNumb: string;
  isOnShift: boolean;
  // Computed server-side: 'Available' | 'Delivering' | 'Off Shift'
  driverStatus: "Available" | "Delivering" | "Off Shift";
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const todayStr = () => new Date().toISOString().slice(0, 10);

type Tab = "assign" | "confirm";

export default function UpdateDeliveryInformationPage() {
  const user = useAuthGuard("warehouse_staff");

  const [tab, setTab] = useState<Tab>("assign");

  const [readyOrders, setReadyOrders] = useState<DeliveryOrder[]>([]);
  const [dispatchedOrders, setDispatchedOrders] = useState<DeliveryOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Clicking a row opens the order's details first.
  const [viewing, setViewing] = useState<DeliveryOrder | null>(null);

  // ---- "Ready to Dispatch" tab: multi-select orders + pick a driver ----
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  // Controls whether the Assign Driver modal is open. Kept separate from
  // selectedOrderIds so ticking a checkbox only selects an order — it does
  // NOT pop the modal open — letting staff select several orders first and
  // only open the modal when they click "Assign Driver".
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({ driverId: "", deliveryDate: todayStr() });
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchConfirming, setDispatchConfirming] = useState(false);

  // ---- "Out for Delivery" tab: mark a batch as delivered ----
  const [deliveringGroup, setDeliveringGroup] = useState<{ deliveryId: number; orders: DeliveryOrder[] } | null>(
    null
  );
  const [deliverForm, setDeliverForm] = useState({ deliveredDate: todayStr(), recipientName: "" });
  const [deliverError, setDeliverError] = useState<string | null>(null);
  const [deliverConfirming, setDeliverConfirming] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [readyRes, dispatchedRes, driversRes] = await Promise.all([
        fetch(`${API_BASE}/api/delivery/orders/ready`),
        fetch(`${API_BASE}/api/delivery/orders/dispatched`),
        fetch(`${API_BASE}/api/drivers`),
      ]);
      const readyData = readyRes.ok ? await readyRes.json() : [];
      const dispatchedData = dispatchedRes.ok ? await dispatchedRes.json() : [];
      const driversData = driversRes.ok ? await driversRes.json() : [];
      setReadyOrders(Array.isArray(readyData) ? readyData : []);
      setDispatchedOrders(Array.isArray(dispatchedData) ? dispatchedData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
    } catch (err) {
      console.error("Failed to load delivery data:", err);
      setReadyOrders([]);
      setDispatchedOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  // ---------------------------------------------------------------------
  // "Ready to Dispatch" tab
  // ---------------------------------------------------------------------

  const filteredReady = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return readyOrders.filter((o) => {
      const matchesQuery = !q || o.orderNumber.toLowerCase().includes(q);
      const matchesDate = !dateFilter || toDateOnly(o.orderDate) === dateFilter;
      return matchesQuery && matchesDate;
    });
  }, [readyOrders, searchQuery, dateFilter]);

  const hasActiveFilters = !!(searchQuery || dateFilter);

  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [searchQuery, dateFilter, tab]);
  const pagedReady = useMemo(() => paginate(filteredReady, page), [filteredReady, page]);

  function clearFilters() {
    setSearchQuery("");
    setDateFilter("");
  }

  function toggleSelected(orderID: number) {
    setSelectedOrderIds((prev) =>
      prev.includes(orderID) ? prev.filter((id) => id !== orderID) : [...prev, orderID]
    );
  }

  const selectedOrders = useMemo(
    () => readyOrders.filter((o) => selectedOrderIds.includes(o.orderID)),
    [readyOrders, selectedOrderIds]
  );

  function openDispatchForm() {
    if (selectedOrderIds.length === 0) return;
    setDispatchForm({ driverId: "", deliveryDate: todayStr() });
    setDispatchError(null);
    setShowDispatchModal(true);
  }

  function handleDispatchSubmit() {
    if (!dispatchForm.driverId || !dispatchForm.deliveryDate) {
      setDispatchError("Please choose a delivery date and a driver.");
      return;
    }
    const driver = drivers.find((d) => d.driverId === Number(dispatchForm.driverId));
    if (!driver) {
      setDispatchError("Please choose a driver.");
      return;
    }
    if (driver.driverStatus !== "Available") {
      setDispatchError(
        driver.driverStatus === "Delivering"
          ? `${driver.driverName} is currently out on another delivery.`
          : `${driver.driverName} is off shift.`
      );
      return;
    }
    setDispatchConfirming(true);
  }

  async function handleDispatchConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/delivery/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          driverId: Number(dispatchForm.driverId),
          deliveryDate: dispatchForm.deliveryDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch delivery");

      setSuccessMessage(data.confirmation || "Driver assigned successfully.");
      setSelectedOrderIds([]);
      setShowDispatchModal(false);
      setDispatchForm({ driverId: "", deliveryDate: todayStr() });
      await loadAll();
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
      setDispatchConfirming(false);
    }
  }

  // ---------------------------------------------------------------------
  // "Out for Delivery" tab — grouped by deliveryId, since one delivery can
  // carry multiple orders assigned to the same driver in one dispatch.
  // ---------------------------------------------------------------------

  const dispatchedGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matches = dispatchedOrders.filter((o) => {
      const matchesQuery = !q || o.orderNumber.toLowerCase().includes(q);
      const matchesDate = !dateFilter || toDateOnly(o.deliveryDate) === dateFilter;
      return matchesQuery && matchesDate;
    });

    const groups = new Map<number, DeliveryOrder[]>();
    matches.forEach((o) => {
      if (!o.deliveryId) return;
      const list = groups.get(o.deliveryId) ?? [];
      list.push(o);
      groups.set(o.deliveryId, list);
    });
    return Array.from(groups.entries()).map(([deliveryId, orders]) => ({ deliveryId, orders }));
  }, [dispatchedOrders, searchQuery, dateFilter]);

  const pagedDispatchedGroups = useMemo(() => paginate(dispatchedGroups, page), [dispatchedGroups, page]);

  function openDeliverForm(group: { deliveryId: number; orders: DeliveryOrder[] }) {
    setDeliveringGroup(group);
    setDeliverForm({ deliveredDate: todayStr(), recipientName: "" });
    setDeliverError(null);
  }

  function closeDeliverForm() {
    setDeliveringGroup(null);
    setDeliverError(null);
  }

  function handleDeliverSubmit() {
    if (!deliverForm.recipientName.trim() || !deliverForm.deliveredDate) {
      setDeliverError("Please fill in delivered date and recipient name.");
      return;
    }
    setDeliverConfirming(true);
  }

  async function handleDeliverConfirm() {
    if (!deliveringGroup) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/delivery/${deliveringGroup.deliveryId}/deliver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveredDate: deliverForm.deliveredDate,
          recipientName: deliverForm.recipientName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark delivery as delivered");

      setSuccessMessage(
        `${deliveringGroup.orders.length} order(s) marked as delivered to "${deliverForm.recipientName.trim()}".`
      );
      await loadAll();
      closeDeliverForm();
    } catch (err) {
      setDeliverError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
      setDeliverConfirming(false);
    }
  }

  if (!user) {
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

        {/* Tabs */}
        <div className="mb-5 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setTab("assign")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              tab === "assign"
                ? "border-b-2 border-sky-600 text-sky-700"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Ready to Dispatch{" "}
            <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
              {readyOrders.length}
            </span>
          </button>
          <button
            onClick={() => setTab("confirm")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              tab === "confirm"
                ? "border-b-2 border-sky-600 text-sky-700"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Out for Delivery{" "}
            <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
              {dispatchedOrders.length}
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
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
              placeholder="Search by order number…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 focus:border-sky-400 focus:outline-none"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-700 focus:border-sky-400 focus:outline-none"
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition hover:border-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {successMessage && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
            {successMessage}
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200/60 bg-white" />
            ))}
          </div>
        ) : tab === "assign" ? (
          <>
            {selectedOrderIds.length > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-[13px] font-semibold text-sky-800">
                  {selectedOrderIds.length} order(s) selected
                </p>
                <button
                  onClick={openDispatchForm}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-sky-700"
                >
                  Assign Driver
                </button>
              </div>
            )}

            {readyOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
                <p className="text-sm font-medium text-slate-500">No records available.</p>
              </div>
            ) : filteredReady.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
                <p className="text-sm font-medium text-slate-500">No orders match your search.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3 w-8"></th>
                      <th className="px-4 py-3">Order #</th>
                      <th className="px-4 py-3">Submitted By</th>
                      <th className="px-4 py-3">Order Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedReady.map((o) => (
                      <tr key={o.orderID} className="transition hover:bg-sky-50/40">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(o.orderID)}
                            onChange={() => toggleSelected(o.orderID)}
                            className="h-4 w-4 accent-sky-600"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">{o.orderNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{o.submittedBy ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(o.orderDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setViewing(o)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5">
                  <Pagination page={page} totalItems={filteredReady.length} onChange={setPage} />
                </div>
              </div>
            )}
          </>
        ) : dispatchedOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">No records available.</p>
          </div>
        ) : dispatchedGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">No deliveries match your search.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pagedDispatchedGroups.map((group) => {
              const first = group.orders[0];
              return (
                <div
                  key={group.deliveryId}
                  className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Out for Delivery
                      </span>
                      <p className="mt-2 text-[13px] text-slate-500">
                        Driver: <span className="font-semibold text-slate-700">{first.driverName ?? "—"}</span>
                        {" · "}
                        Dispatch Date: <span className="font-semibold text-slate-700">{formatDate(first.deliveryDate)}</span>
                      </p>
                      <p className="mt-1 flex flex-wrap gap-1.5 text-[12px] text-slate-500">
                        {group.orders.map((o) => (
                          <button
                            key={o.orderID}
                            onClick={() => setViewing(o)}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700"
                          >
                            {o.orderNumber}
                          </button>
                        ))}
                      </p>
                    </div>
                    <button
                      onClick={() => openDeliverForm(group)}
                      className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700"
                    >
                      Mark as Delivered
                    </button>
                  </div>
                </div>
              );
            })}
            <Pagination page={page} totalItems={dispatchedGroups.length} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Order details popup */}
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
                <p className="font-semibold text-slate-700">{viewing.driverName ?? "Not yet"}</p>
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
                        {formatCurrency(item.productPrice)}
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

            <div className="mt-5">
              <button
                onClick={() => setViewing(null)}
                className="w-full rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch modal, opened via "Assign Driver" button */}
      {showDispatchModal && (
        <DispatchModal
          selectedOrders={selectedOrders}
          drivers={drivers}
          form={dispatchForm}
          setForm={setDispatchForm}
          error={dispatchError}
          submitting={submitting}
          confirming={dispatchConfirming}
          onSubmit={handleDispatchSubmit}
          onConfirm={handleDispatchConfirm}
          onCancelConfirm={() => setDispatchConfirming(false)}
          onClose={() => {
            setShowDispatchModal(false);
            setDispatchError(null);
          }}
        />
      )}

      {/* Mark as Delivered modal */}
      {deliveringGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              {deliveringGroup.orders.map((o) => o.orderNumber).join(", ")}
            </span>
            <h3 className="mt-1 mb-4 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Confirm Delivery
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Delivered Date
                </label>
                <input
                  type="date"
                  value={deliverForm.deliveredDate}
                  onChange={(e) => setDeliverForm({ ...deliverForm, deliveredDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Recipient Name
                </label>
                <input
                  value={deliverForm.recipientName}
                  onChange={(e) => setDeliverForm({ ...deliverForm, recipientName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            {deliverError && <p className="mt-3 text-[12.5px] font-medium text-rose-600">{deliverError}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeDeliverForm}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeliverSubmit}
                disabled={submitting}
                className="flex-1 rounded-lg bg-sky-600 py-2.5 text-xs font-bold uppercase text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {deliverConfirming && deliveringGroup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">Confirmation</span>
            <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Confirm Delivery Update
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Mark {deliveringGroup.orders.length} order(s) as Delivered to "{deliverForm.recipientName}"? This will
              add the ordered quantities back into retail stock.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeliverConfirming(false)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeliverConfirm}
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

function DispatchModal({
  selectedOrders,
  drivers,
  form,
  setForm,
  error,
  submitting,
  confirming,
  onSubmit,
  onConfirm,
  onCancelConfirm,
  onClose,
}: {
  selectedOrders: DeliveryOrder[];
  drivers: Driver[];
  form: { driverId: string; deliveryDate: string };
  setForm: (f: { driverId: string; deliveryDate: string }) => void;
  error: string | null;
  submitting: boolean;
  confirming: boolean;
  onSubmit: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  onClose: () => void;
}) {
  const selectedDriver = drivers.find((d) => d.driverId === Number(form.driverId));

  if (confirming) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">Confirmation</span>
          <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
            Confirm Driver Assignment
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Assign {selectedOrders.length} order(s) to {selectedDriver?.driverName}?
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={onCancelConfirm}
              disabled={submitting}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={submitting}
              className="flex-1 rounded-lg bg-sky-600 py-2.5 text-xs font-bold uppercase text-white transition hover:bg-sky-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
          {selectedOrders.length} order(s)
        </span>
        <h3 className="mt-1 mb-4 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
          Assign Driver
        </h3>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {selectedOrders.map((o) => (
            <span
              key={o.orderID}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600"
            >
              {o.orderNumber}
            </span>
          ))}
        </div>

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
              Driver
            </label>
            <select
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
            >
              <option value="">Select a driver…</option>
              {drivers.map((d) => (
                <option key={d.driverId} value={d.driverId} disabled={d.driverStatus !== "Available"}>
                  {d.driverName} · {d.driverPhoneNumb} — {d.driverStatus}
                  {d.driverStatus !== "Available" ? " (unavailable)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Only drivers who are on shift and not already out on another delivery can be assigned.
            </p>
          </div>
        </div>

        {error && <p className="mt-3 text-[12.5px] font-medium text-rose-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 rounded-lg bg-sky-600 py-2.5 text-xs font-bold uppercase text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
