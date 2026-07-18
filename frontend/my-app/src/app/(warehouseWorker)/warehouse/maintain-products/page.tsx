"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
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
  productImage?: string | null;
  prodCatLookupId?: number | null;
  prodBrandLookupId?: number | null;
  categoryName?: string;
  brandName?: string;
}

interface Lookup {
  id: number;
  name: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const EMPTY_FORM = {
  productCode: "",
  productModel: "",
  productPrice: "",
  handInStock: "",
  productStatus: "Available",
  prodCatLookupId: "",
  prodBrandLookupId: "",
  productImage: "",
};

type Mode = "add" | "edit" | null;

export default function MaintainProductPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [brands, setBrands] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<Mode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

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
      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch(`${API_BASE}/api/maintain-product/menu`),
        fetch(`${API_BASE}/api/categories`),
        fetch(`${API_BASE}/api/brands`),
      ]);
      const prodData = prodRes.ok ? await prodRes.json() : [];
      const catData = catRes.ok ? await catRes.json() : [];
      const brandData = brandRes.ok ? await brandRes.json() : [];
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(
        Array.isArray(catData) ? catData.map((c: any) => ({ id: c.prodCatLookupId, name: c.productCategory })) : []
      );
      setBrands(
        Array.isArray(brandData) ? brandData.map((b: any) => ({ id: b.prodBrandLookupId, name: b.productBrand })) : []
      );
    } catch (err) {
      console.error("Failed to load maintain-product data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checkingAuth || !user) return;
    loadAll();
  }, [checkingAuth, user]);

  function openAdd() {
    setMode("add");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function openEdit(p: Product) {
    setMode("edit");
    setEditingId(p.productID);
    setForm({
      productCode: p.productCode ?? "",
      productModel: p.productModel ?? "",
      productPrice: String(p.productPrice ?? ""),
      handInStock: String(p.handInStock ?? "0"),
      productStatus: p.productStatus ?? "Available",
      prodCatLookupId: p.prodCatLookupId ? String(p.prodCatLookupId) : "",
      prodBrandLookupId: p.prodBrandLookupId ? String(p.prodBrandLookupId) : "",
      productImage: p.productImage ?? "",
    });
    setFormError(null);
  }

  function closeForm() {
    setMode(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  // [E2: Required fields missing]
  function validate(): string | null {
    if (!form.productCode.trim() || !form.productModel.trim() || !form.productPrice.trim()) {
      return "Please fill in all required fields (code, model, price).";
    }
    if (Number.isNaN(Number(form.productPrice)) || Number(form.productPrice) < 0) {
      return "Price must be a valid number.";
    }
    // [E1: Duplicate Item] — same code, different product
    const duplicate = products.find(
      (p) => p.productCode.trim().toLowerCase() === form.productCode.trim().toLowerCase() && p.productID !== editingId
    );
    if (duplicate) return "A product with this code already exists.";
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setConfirmMessage(mode === "add" ? "Add this new product?" : "Save changes to this product?");
  }

  async function handleConfirm() {
    setSubmitting(true);
    setFormError(null);
    try {
      const body = {
        productCode: form.productCode.trim(),
        productModel: form.productModel.trim(),
        productPrice: Number(form.productPrice),
        handInStock: Number(form.handInStock) || 0,
        productStatus: form.productStatus,
        prodCatLookupId: form.prodCatLookupId ? Number(form.prodCatLookupId) : null,
        prodBrandLookupId: form.prodBrandLookupId ? Number(form.prodBrandLookupId) : null,
        productImage: form.productImage.trim() || null,
      };

      const res =
        mode === "add"
          ? await fetch(`${API_BASE}/api/maintain-product`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
          : await fetch(`${API_BASE}/api/maintain-product/${editingId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      await loadAll();
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
      const res = await fetch(`${API_BASE}/api/maintain-product/${deleteTarget.productID}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete product");
      await loadAll();
    } catch (err) {
      console.error("Failed to delete product:", err);
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
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              WAREHOUSE STAFF
            </span>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
              Maintain Product
            </h1>
          </div>
          <button
            onClick={openAdd}
            className="rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-sky-700"
          >
            + Add New Product
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200/60 bg-white" />
            ))}
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
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.productID} className="transition hover:bg-sky-50/40">
                    <td className="px-5 py-3 font-mono text-[12px] text-slate-500">{p.productCode}</td>
                    <td className="px-5 py-3 text-slate-600">{p.categoryName ?? "—"}</td>
                    <td className="px-5 py-3 font-semibold text-sky-700">{p.brandName ?? "Generic"}</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{p.productModel}</td>
                    <td className="px-5 py-3 text-slate-600">${Number(p.productPrice).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${
                          p.productStatus === "Available"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {p.productStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
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

      {/* Add / Edit form */}
      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              {mode === "add" ? "Add New Product" : "Edit Product"}
            </span>
            <h3 className="mt-1 mb-4 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Product Details
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Product Code *
                </label>
                <input
                  value={form.productCode}
                  onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Model *
                </label>
                <input
                  value={form.productModel}
                  onChange={(e) => setForm({ ...form, productModel: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.productPrice}
                    onChange={(e) => setForm({ ...form, productPrice: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Hand In Stock
                  </label>
                  <input
                    type="number"
                    value={form.handInStock}
                    onChange={(e) => setForm({ ...form, handInStock: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Category
                  </label>
                  <select
                    value={form.prodCatLookupId}
                    onChange={(e) => setForm({ ...form, prodCatLookupId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                  >
                    <option value="">—</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Brand
                  </label>
                  <select
                    value={form.prodBrandLookupId}
                    onChange={(e) => setForm({ ...form, prodBrandLookupId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                  >
                    <option value="">—</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Status
                </label>
                <select
                  value={form.productStatus}
                  onChange={(e) => setForm({ ...form, productStatus: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Image URL (optional)
                </label>
                <input
                  value={form.productImage}
                  onChange={(e) => setForm({ ...form, productImage: e.target.value })}
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
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-rose-400">Delete Product</span>
            <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              {deleteTarget.productModel}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete this product? This cannot be undone.
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
