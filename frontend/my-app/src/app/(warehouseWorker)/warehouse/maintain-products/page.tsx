"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Pagination, { paginate } from "@/src/app/components/Pagination";
import { formatCurrency } from "@/src/lib/format";
import { useAuthGuard } from "@/src/lib/useAuthGuard";

interface Product {
  productID: number;
  productCode: string;
  productModel: string;
  productPrice: number;
  handInStock: number;
  // Warehouse quantity, managed here by Warehouse Staff. This is the
  // ceiling on what a Supervisor can order, and it drives productStatus
  // automatically (0 => "Not Available") — there is no manual status toggle.
  productQuantity: number;
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
  productQuantity: "0",
  prodCatLookupId: "",
  prodBrandLookupId: "",
  productImage: "",
};

type Mode = "add" | "edit" | null;

// Availability filter values: "" = all, "Available", "Not Available"
type AvailabilityFilter = "" | "Available" | "Not Available";

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

function ProductTile({ product, onClick }: { product: Product; onClick: () => void }) {
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
        {product.productStatus !== "Available" && (
          <span className="absolute right-2 top-2 rounded-md bg-slate-600 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
            Not Available
          </span>
        )}
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
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
              product.productStatus === "Available"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-500"
            }`}
          >
            {product.productStatus}
          </span>
          <span className="font-mono text-[10px] text-slate-400">{product.productQuantity} in warehouse</span>
        </div>
      </div>
    </button>
  );
}

export default function MaintainProductPage() {
  const user = useAuthGuard("warehouse_staff");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [brands, setBrands] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Search / filter state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("");
  const [page, setPage] = useState(1);

  // --- Details popup ---
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // --- Add / edit form ---
  const [mode, setMode] = useState<Mode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize + compress the picked image on a canvas before turning it into a
  // data URL, so we send as few bytes as the backend column allows.
  function compressImage(file: File, maxDimension = 480, quality = 0.6): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Could not read image"));
        img.onload = () => {
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImageFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setImageProcessing(true);
    setFormError(null);
    try {
      const compressed = await compressImage(file);
      setForm((prev) => ({ ...prev, productImage: compressed }));
    } catch (err) {
      console.error("Failed to process image:", err);
      setFormError("Couldn't process that image. Please try a different file.");
    } finally {
      setImageProcessing(false);
    }
  }

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
    if (!user) return;
    loadAll();
  }, [user]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.productModel?.toLowerCase().includes(q) ||
        p.productCode?.toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || String(p.prodCatLookupId ?? "") === categoryFilter;
      const matchesBrand = !brandFilter || String(p.prodBrandLookupId ?? "") === brandFilter;
      const matchesAvailability = !availabilityFilter || p.productStatus === availabilityFilter;
      return matchesQuery && matchesCategory && matchesBrand && matchesAvailability;
    });
  }, [products, searchQuery, categoryFilter, brandFilter, availabilityFilter]);

  // Available products render first; "Not Available" products are grouped below.
  const orderedProducts = useMemo(
    () => [
      ...filteredProducts.filter((p) => p.productStatus === "Available"),
      ...filteredProducts.filter((p) => p.productStatus !== "Available"),
    ],
    [filteredProducts]
  );
  const pagedProducts = useMemo(() => paginate(orderedProducts, page), [orderedProducts, page]);
  const availableProducts = pagedProducts.filter((p) => p.productStatus === "Available");
  const unavailableProducts = pagedProducts.filter((p) => p.productStatus !== "Available");

  const hasActiveFilters = !!(searchQuery || categoryFilter || brandFilter || availabilityFilter);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter, brandFilter, availabilityFilter]);

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("");
    setBrandFilter("");
    setAvailabilityFilter("");
  }

  function openAdd() {
    setMode("add");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function openEdit(p: Product) {
    setViewingProduct(null);
    setMode("edit");
    setEditingId(p.productID);
    setForm({
      productCode: p.productCode ?? "",
      productModel: p.productModel ?? "",
      productPrice: String(p.productPrice ?? ""),
      productQuantity: String(p.productQuantity ?? "0"),
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

  // [E2: Required fields missing] — every field in the form is required, not
  // just code/model/price, so a product can't be saved half-filled-in.
  function validate(): string | null {
    if (
      !form.productModel.trim() ||
      !form.productPrice.trim() ||
      !form.prodCatLookupId ||
      !form.prodBrandLookupId ||
      form.productQuantity.trim() === "" ||
      !form.productImage.trim()
    ) {
      return "Please fill in all required fields.";
    }
    if (Number.isNaN(Number(form.productPrice)) || Number(form.productPrice) < 0) {
      return "Price must be a valid number.";
    }
    if (Number.isNaN(Number(form.productQuantity)) || Number(form.productQuantity) < 0) {
      return "Warehouse quantity must be a valid, non-negative number.";
    }
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
        productModel: form.productModel.trim(),
        productPrice: Number(form.productPrice),
        productQuantity: Number(form.productQuantity) || 0,
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

      if (res.status === 413) {
        // The server rejected the request body itself (before it ever reached
        // Postgres) because it was larger than the API's JSON body limit.
        throw new Error(
          "This image is too large to upload. Please choose a smaller photo, or try one with less detail."
        );
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const rawMessage: string = data.error || "";
        if (/value too long/i.test(rawMessage) || /character varying/i.test(rawMessage)) {
          // Legacy safeguard: if the deployed database still has the old
          // short "productImage" varchar (pre-migration), surface a clear
          // message instead of a raw Postgres error.
          throw new Error(
            "This image is too large for the database to store. The \"productImage\" column needs to be " +
              "widened to TEXT — run: ALTER TABLE products ALTER COLUMN \"productImage\" TYPE TEXT;"
          );
        }
        throw new Error(rawMessage || "Failed to save product");
      }

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
      setViewingProduct(null);
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
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              WAREHOUSE STAFF
            </span>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
              Maintain Product
            </h1>
            <p className="mt-1 text-xs text-slate-400">
            Add, Edit or Remove Product
          </p>
          </div>
          <button
            onClick={openAdd}
            className="rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-sky-700"
          >
            + Add New Product
          </button>
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
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
            >
              <option value="">Availability</option>
              <option value="Available">Available</option>
              <option value="Not Available">Not Available</option>
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
              <div key={i} className="h-[280px] animate-pulse rounded-2xl border border-slate-200/60 bg-white" />
            ))}
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
            {/* Available products */}
            {availableProducts.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {availableProducts.map((p) => (
                  <ProductTile key={p.productID} product={p} onClick={() => setViewingProduct(p)} />
                ))}
              </div>
            )}

            {/* Not Available products, grouped below with a divider */}
            {unavailableProducts.length > 0 && (
              <>
                <div className={`mb-4 flex items-center gap-3 ${availableProducts.length > 0 ? "mt-10" : ""}`}>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Not Available
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {unavailableProducts.map((p) => (
                    <ProductTile key={p.productID} product={p} onClick={() => setViewingProduct(p)} />
                  ))}
                </div>
              </>
            )}

            <Pagination page={page} totalItems={orderedProducts.length} onChange={setPage} />
          </>
        )}
      </div>

      {/* Details popup */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
                {viewingProduct.productCode}
              </span>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-slate-400 transition hover:text-slate-600"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row">
              <div className="h-48 w-full flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 sm:w-48">
                <ProductImage src={viewingProduct.productImage} alt={viewingProduct.productModel} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-400">
                  {viewingProduct.categoryName && (
                    <>
                      <span className="uppercase tracking-wide text-slate-500">{viewingProduct.categoryName}</span>
                      <span>•</span>
                    </>
                  )}
                  <span className="font-semibold uppercase text-sky-600">{viewingProduct.brandName ?? "Generic"}</span>
                </div>
                <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
                  {viewingProduct.productModel}
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(viewingProduct.productPrice)}</p>

                <div className="mt-3 flex items-center gap-2 text-[13px]">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-semibold ${viewingProduct.productStatus === "Available" ? "text-emerald-600" : "text-slate-600"}`}>
                    {viewingProduct.productStatus}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[13px]">
                  <span className="text-slate-400">Warehouse Quantity:</span>
                  <span className="font-semibold text-slate-700">{viewingProduct.productQuantity}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setDeleteTarget(viewingProduct)}
                className="flex-1 rounded-lg border border-rose-200 bg-white py-2.5 text-xs font-bold uppercase text-rose-500 transition hover:border-rose-300 hover:bg-rose-50"
              >
                Delete
              </button>
              <button
                onClick={() => openEdit(viewingProduct)}
                className="flex-1 rounded-lg bg-sky-600 py-2.5 text-xs font-bold uppercase text-white transition hover:bg-sky-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              {mode === "add" ? "Add New Product" : "Edit Product"}
            </span>
            <h3 className="mt-1 mb-4 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Product Details
            </h3>

            <div className="flex flex-col gap-3">
              {/* Click-to-upload image */}
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Product Image *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageProcessing}
                  className="group flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-sky-300 hover:bg-sky-50/40 disabled:cursor-wait disabled:opacity-70"
                >
                  {imageProcessing ? (
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                      Processing image…
                    </span>
                  ) : form.productImage ? (
                    <img src={form.productImage} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-sky-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-7 w-7"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                        />
                      </svg>
                      <span className="text-[12px] font-semibold uppercase tracking-wide">Click to upload</span>
                    </div>
                  )}
                </button>
                {form.productImage && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, productImage: "" }))}
                    className="mt-1.5 text-[11px] font-semibold text-rose-500 hover:text-rose-600"
                  >
                    Remove image
                  </button>
                )}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Product Code
                </label>
                {mode === "edit" ? (
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 font-mono text-sm text-slate-500">
                    {form.productCode}
                  </div>
                ) : (
                  <div className="w-full rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm italic text-slate-400">
                    Generated automatically after you submit
                  </div>
                )}
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
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Price (RM) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.productPrice}
                  onChange={(e) => setForm({ ...form, productPrice: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Category *
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
                    Brand *
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
                  Warehouse Quantity *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.productQuantity}
                  onChange={(e) => setForm({ ...form, productQuantity: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  How many units are on hand at the warehouse. This determines whether the product shows as
                  Available to Supervisors — it isn't set manually.
                </p>
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