"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  userFullname: string;
  username: string;
  role: string;
}

interface Brand {
  prodBrandLookupId: number;
  productBrand: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const MAX_LEN = 50;

type Mode = "add" | "edit" | null;

export default function ManageProductBrandPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [mode, setMode] = useState<Mode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Auth verification ---
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

  async function loadBrands() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE}/api/brands`);
      if (!res.ok) throw new Error("Failed to load brands");
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load brands:", err);
      setLoadError("Couldn't load the brand list. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checkingAuth || !user) return;
    loadBrands();
  }, [checkingAuth, user]);

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.productBrand.toLowerCase().includes(q));
  }, [brands, searchQuery]);

  function openAdd() {
    setMode("add");
    setEditingId(null);
    setName("");
    setFormError(null);
  }

  function openEdit(c: Brand) {
    setMode("edit");
    setEditingId(c.prodBrandLookupId);
    setName(c.productBrand);
    setFormError(null);
  }

  function closeForm() {
    setMode(null);
    setEditingId(null);
    setName("");
    setFormError(null);
  }

  // [E1: Invalid Form Submission] / [E2: Duplicate Brand]
  function validate(): string | null {
    if (!name.trim()) return "Brand name is required.";
    if (name.trim().length > MAX_LEN) return `Brand name must be ${MAX_LEN} characters or fewer.`;
    const duplicate = brands.find(
      (c) => c.productBrand.trim().toLowerCase() === name.trim().toLowerCase() && c.prodBrandLookupId !== editingId
    );
    if (duplicate) return `Brand "${name.trim()}" already exists.`;
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setConfirmMessage(mode === "add" ? "Add this new brand?" : "Save changes to this brand?");
  }

  async function handleConfirm() {
    setSubmitting(true);
    setFormError(null);
    try {
      const res =
        mode === "add"
          ? await fetch(`${API_BASE}/api/brands`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productBrand: name.trim() }),
            })
          : await fetch(`${API_BASE}/api/brands/${editingId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productBrand: name.trim() }),
            });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save brand");

      setSuccessMessage(mode === "add" ? "New brand added." : "Brand updated.");
      await loadBrands();
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
      setConfirmMessage(null);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/brands/${deleteTarget.prodBrandLookupId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete brand");
      }
      setSuccessMessage(`Brand "${deleteTarget.productBrand}" deleted.`);
      await loadBrands();
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete brand:", err);
      setDeleteTarget(null);
    } finally {
      setSubmitting(false);
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
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              WAREHOUSE STAFF
            </span>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
              Manage Product Brand
            </h1>
          </div>
          <button
            onClick={openAdd}
            className="rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-sky-700"
          >
            + Add New Brand
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
            placeholder="Search brands…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 focus:border-sky-400 focus:outline-none"
          />
        </div>

        {successMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl border border-slate-200/60 bg-white" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-rose-600">{loadError}</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">No brands yet. Add your first one above.</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">No brands match your search.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Brand Name</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBrands.map((c) => (
                  <tr key={c.prodBrandLookupId} className="transition hover:bg-sky-50/40">
                    <td className="px-5 py-3 font-bold text-slate-800">{c.productBrand}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit form */}
      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              {mode === "add" ? "Add New Brand" : "Edit Brand"}
            </span>
            <h3 className="mt-1 mb-4 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Brand Details
            </h3>

            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Brand Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_LEN}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
            />

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

      {/* Save confirmation */}
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

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-rose-400">Delete Brand</span>
            <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              {deleteTarget.productBrand}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete this brand? This cannot be undone.
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
