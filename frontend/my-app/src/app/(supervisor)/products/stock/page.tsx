"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  userId: number;
  userFullname: string;
  username: string;
  role: string;
}

interface Product {
  productID: number;
  productCode: string;
  productModel: string;
  productPrice: number;
  handInStock: number;
  productStatus: string;
  categoryName?: string;
  brandName?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function UpdateProductStockPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingMessage, setConfirmingMessage] = useState<string | null>(null);

  // --- Auth Verification (Supervisor only) ---
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

  // --- 1.2 The system displays a list of products in the shop ---
  async function loadProducts() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE}/api/stock/list`);
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch stock list:", err);
      setLoadError("Couldn't load the product list. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checkingAuth || !user) return;
    loadProducts();
  }, [checkingAuth, user]);

  // 1.3 Supervisor select product / 1.4 system displays product details form
  function openStockForm(product: Product) {
    setSelected(product);
    setQuantityInput(String(product.handInStock));
    setFormError(null);
  }

  function closeStockForm() {
    setSelected(null);
    setQuantityInput("");
    setFormError(null);
  }

  // 1.5 Supervisor updates the quantity / 1.6 confirmation message
  function handleSubmit() {
    if (!selected) return;
    const parsed = Number(quantityInput);

    // [E1: Error "Please enter a value greater than 0"]
    if (!quantityInput.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setFormError("Please enter a value greater than 0");
      return;
    }

    setConfirmingMessage(
      `Update stock for "${selected.productModel}" to ${parsed} unit${parsed === 1 ? "" : "s"}?`
    );
  }

  // 1.7 Supervisor confirmed the message / 1.8 system updates the quantity
  async function handleConfirmUpdate() {
    if (!selected) return;
    const parsed = Number(quantityInput);
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_BASE}/api/stock/${selected.productID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handInStock: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stock");

      // 1.9 The system displays the updated stock list.
      await loadProducts();
      closeStockForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
      setConfirmingMessage(null);
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
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400 transition hover:text-sky-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Product Directory
        </Link>

        <div className="mb-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
            STOCK MANAGEMENT SYSTEM
          </span>
          <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
            Update Product Stock
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Select a product below to update its hand-in-stock quantity after new items are delivered.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200/60 bg-white" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-rose-600">{loadError}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">No records available.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Brand</th>
                  <th className="px-5 py-3">Model</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Hand In Stock</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isLow = p.handInStock <= 5;
                  return (
                    <tr key={p.productID} className="transition hover:bg-sky-50/40">
                      <td className="px-5 py-3 font-mono text-[12px] text-slate-500">{p.productCode}</td>
                      <td className="px-5 py-3 text-slate-600">{p.categoryName ?? "—"}</td>
                      <td className="px-5 py-3 font-semibold text-sky-700">{p.brandName ?? "Generic"}</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{p.productModel}</td>
                      <td className="px-5 py-3 text-slate-600">${Number(p.productPrice).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold ${
                            p.handInStock === 0
                              ? "border-rose-200 bg-rose-50 text-rose-600"
                              : isLow
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {p.handInStock}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => openStockForm(p)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                        >
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1.4 Product details form — only quantity is editable */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              Update Stock
            </span>
            <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              {selected.productModel}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-[12.5px]">
              <div>
                <p className="text-[10px] uppercase text-slate-400">Code</p>
                <p className="font-semibold text-slate-700">{selected.productCode}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Category</p>
                <p className="font-semibold text-slate-700">{selected.categoryName ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Brand</p>
                <p className="font-semibold text-slate-700">{selected.brandName ?? "Generic"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Price</p>
                <p className="font-semibold text-slate-700">${Number(selected.productPrice).toFixed(2)}</p>
              </div>
            </div>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Hand In Stock Quantity
            </label>
            <input
              type="number"
              min={1}
              value={quantityInput}
              onChange={(e) => {
                setQuantityInput(e.target.value.replace(/[^0-9]/g, ""));
                setFormError(null);
              }}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-400/15"
            />
            {formError && <p className="mt-2 text-[12.5px] font-medium text-rose-600">{formError}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeStockForm}
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

      {/* 1.6 Update confirmation message */}
      {confirmingMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              Confirmation
            </span>
            <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Confirm Stock Update
            </h3>
            <p className="mt-2 text-sm text-slate-500">{confirmingMessage}</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmingMessage(null)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpdate}
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
