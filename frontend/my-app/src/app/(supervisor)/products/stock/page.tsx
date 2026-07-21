"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/src/app/components/Navbar";
import Pagination, { paginate } from "@/src/app/components/Pagination";
import { formatCurrency } from "@/src/lib/format";
import { useAuthGuard } from "@/src/lib/useAuthGuard";

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

// Threshold below which a stocked (non-zero) product counts as "low stock".
const LOW_STOCK_THRESHOLD = 5;

// Stock-level filter values: "" = all, "low" = low stock (1-5), "empty" = out of stock
type StockFilter = "" | "low" | "empty";

function stockLevel(p: Product): "empty" | "low" | "ok" {
  if (p.handInStock === 0) return "empty";
  if (p.handInStock <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

function ProductImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }
  return (
    <div className={`flex items-center justify-center bg-slate-50 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1"
        stroke="currentColor"
        className="h-10 w-10 text-slate-300"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        />
      </svg>
    </div>
  );
}

function StockProductTile({ product, onClick }: { product: Product; onClick: () => void }) {
  const level = stockLevel(product);
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-slate-200/60 bg-white p-4 text-left shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_22px_45px_-20px_rgba(14,165,233,0.15)]"
    >
      <div className="relative mb-3 h-36 overflow-hidden rounded-xl border border-slate-100">
        <ProductImage
          src={product.productImage}
          alt={product.productModel}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-slate-400">
        {product.categoryName && (
          <>
            <span className="uppercase tracking-wide text-slate-500">{product.categoryName}</span>
            <span>•</span>
          </>
        )}
        <span className="font-semibold uppercase text-sky-600">{product.brandName ?? "Generic"}</span>
      </div>

      <h3 className="mt-1 line-clamp-2 min-h-[38px] text-[14px] font-bold text-slate-800 transition group-hover:text-sky-700">
        {product.productModel}
      </h3>

      <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Price</p>
          <p className="text-base font-bold text-slate-900">{formatCurrency(product.productPrice)}</p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold ${
            level === "empty"
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : level === "low"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {product.handInStock} in stock
        </span>
      </div>
    </button>
  );
}

export default function UpdateProductStockPage() {
  const user = useAuthGuard("supervisor");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [brands, setBrands] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Search / filter state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingMessage, setConfirmingMessage] = useState<string | null>(null);

  // --- 1.2 The system displays a list of products in the shop ---
  async function loadAll() {
    setLoading(true);
    setLoadError(null);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch(`${API_BASE}/api/stock/list`),
        fetch(`${API_BASE}/api/categories`),
        fetch(`${API_BASE}/api/brands`),
      ]);
      if (!prodRes.ok) throw new Error("Failed to load products");
      const prodData = await prodRes.json();
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
      console.error("Failed to fetch stock list:", err);
      setLoadError("Couldn't load the product list. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q || p.productModel?.toLowerCase().includes(q) || p.productCode?.toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || String(p.prodCatLookupId ?? "") === categoryFilter;
      const matchesBrand = !brandFilter || String(p.prodBrandLookupId ?? "") === brandFilter;
      const matchesStock =
        !stockFilter ||
        (stockFilter === "low" && stockLevel(p) === "low") ||
        (stockFilter === "empty" && stockLevel(p) === "empty");
      return matchesQuery && matchesCategory && matchesBrand && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, brandFilter, stockFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter, brandFilter, stockFilter]);

  const pagedProducts = useMemo(() => paginate(filteredProducts, page), [filteredProducts, page]);

  const lowStockCount = useMemo(() => products.filter((p) => stockLevel(p) === "low").length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => stockLevel(p) === "empty").length, [products]);

  const hasActiveFilters = !!(searchQuery || categoryFilter || brandFilter || stockFilter);

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("");
    setBrandFilter("");
    setStockFilter("");
  }

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

    // [E1] Stock can be updated down to 0 (e.g. sold out completely) — only
    // negative or non-numeric input is rejected.
    if (!quantityInput.trim() || Number.isNaN(parsed) || parsed < 0) {
      setFormError("Please enter a value of 0 or greater");
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
      await loadAll();
      closeStockForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
      setConfirmingMessage(null);
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] font-sans text-slate-700">
      <Navbar />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

        <div className="mb-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
            STOCK MANAGEMENT SYSTEM
          </span>
          <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
            Update Product Stock
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Click a product below to update its hand-in-stock quantity after new items are delivered.
          </p>
        </div>

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
              placeholder="Search by product code or model…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 focus:border-sky-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
            >
              <option value="">Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
            >
              <option value="">Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
            >
              <option value="">Stock Levels</option>
              <option value="low">Low Stock ({lowStockCount})</option>
              <option value="empty">Out of Stock ({outOfStockCount})</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-rose-600 transition hover:border-rose-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[260px] animate-pulse rounded-2xl border border-slate-200/60 bg-white" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-rose-600">{loadError}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">
              {hasActiveFilters ? "No products match your search or filters." : "No records available."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-sky-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-800 transition hover:bg-sky-200"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {pagedProducts.map((p) => (
                <StockProductTile key={p.productID} product={p} onClick={() => openStockForm(p)} />
              ))}
            </div>
            <Pagination page={page} totalItems={filteredProducts.length} onChange={setPage} />
          </>
        )}
      </div>

      {/* 1.4 Product details form — only quantity is editable */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-3 h-32 w-full overflow-hidden rounded-xl border border-slate-100">
              <ProductImage src={selected.productImage} alt={selected.productModel} className="h-full w-full object-cover" />
            </div>

            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              {selected.productCode}
            </span>
            <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              {selected.productModel}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-[12.5px]">
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
                <p className="font-semibold text-slate-700">{formatCurrency(selected.productPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Status</p>
                <p className="font-semibold text-slate-700">{selected.productStatus}</p>
              </div>
            </div>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Hand In Stock Quantity
            </label>
            <input
              type="number"
              min={0}
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
