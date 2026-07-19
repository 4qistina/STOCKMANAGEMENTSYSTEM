"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  userFullname: string;
  username: string;
  role: string;
}

interface Driver {
  driverId: number;
  driverName: string;
  driverPhoneNumb: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const EMPTY_FORM = { driverName: "", driverPhoneNumb: "" };

type Mode = "add" | "edit" | null;

export default function ManageDriverInformationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [mode, setMode] = useState<Mode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

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

  async function loadDrivers() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/drivers`);
      const data = res.ok ? await res.json() : [];
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load drivers:", err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checkingAuth || !user) return;
    loadDrivers();
  }, [checkingAuth, user]);

  const filteredDrivers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(
      (d) => d.driverName.toLowerCase().includes(q) || d.driverPhoneNumb.toLowerCase().includes(q)
    );
  }, [drivers, searchQuery]);

  function openAdd() {
    setMode("add");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function openEdit(d: Driver) {
    setMode("edit");
    setEditingId(d.driverId);
    setForm({ driverName: d.driverName, driverPhoneNumb: d.driverPhoneNumb });
    setFormError(null);
  }

  function closeForm() {
    setMode(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function validate(): string | null {
    if (!form.driverName.trim() || !form.driverPhoneNumb.trim()) {
      return "A driver record cannot be saved without a valid name and phone number.";
    }
    const duplicate = drivers.find(
      (d) =>
        d.driverName.trim().toLowerCase() === form.driverName.trim().toLowerCase() &&
        d.driverPhoneNumb.trim() === form.driverPhoneNumb.trim() &&
        d.driverId !== editingId
    );
    if (duplicate) return "This driver already exists.";
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setConfirmMessage(mode === "add" ? "Add this new driver?" : "Save changes to this driver?");
  }

  async function handleConfirm() {
    setSubmitting(true);
    setFormError(null);
    try {
      const body = { driverName: form.driverName.trim(), driverPhoneNumb: form.driverPhoneNumb.trim() };
      const res =
        mode === "add"
          ? await fetch(`${API_BASE}/api/drivers`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
          : await fetch(`${API_BASE}/api/drivers/${editingId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save driver");

      await loadDrivers();
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
      setConfirmMessage(null);
    }
  }

  // Second confirmation before permanent delete, per special requirements
  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/drivers/${deleteTarget.driverId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete driver");
      await loadDrivers();
    } catch (err) {
      console.error("Failed to delete driver:", err);
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
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
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              WAREHOUSE STAFF
            </span>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
              Manage Driver Information
            </h1>
          </div>
          <button
            onClick={openAdd}
            className="rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-sky-700"
          >
            + Add New Driver
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-6 relative">
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
            placeholder="Search by name or phone number…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 focus:border-sky-400 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200/60 bg-white" />
            ))}
          </div>
        ) : drivers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">No records available.</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">No drivers match your search.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Phone Number</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.map((d) => (
                  <tr key={d.driverId} className="transition hover:bg-sky-50/40">
                    <td className="px-5 py-3 font-bold text-slate-800">{d.driverName}</td>
                    <td className="px-5 py-3 text-slate-600">{d.driverPhoneNumb}</td>
                    <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(d)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(d)}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-500 transition hover:border-rose-300 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              {mode === "add" ? "Add New Driver" : "Edit Driver"}
            </span>
            <h3 className="mt-1 mb-4 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Driver Details
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Name *
                </label>
                <input
                  value={form.driverName}
                  onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Phone Number *
                </label>
                <input
                  value={form.driverPhoneNumb}
                  onChange={(e) => setForm({ ...form, driverPhoneNumb: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
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
                {mode === "add" ? "Submit" : "Save Changes"}
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
              Confirm
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

      {/* Second confirmation before permanent delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-rose-400">Delete Driver</span>
            <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              {deleteTarget.driverName}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to permanently delete this driver record?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={submitting}
                className="flex-1 rounded-lg bg-rose-600 py-2.5 text-xs font-bold uppercase text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
