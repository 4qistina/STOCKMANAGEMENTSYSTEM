"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/app/components/Navbar";
import Pagination, { paginate } from "@/src/app/components/Pagination";
import { formatCurrency } from "@/src/lib/format";
import { useAuthGuard } from "@/src/lib/useAuthGuard";

// Availability filter values: "" = all, "available", "unavailable"
type AvailabilityFilter = "" | "available" | "unavailable";

interface Product {
  productID?: number;
  productCode?: string;
  productModel?: string;
  productPrice?: number;
  handInStock?: number;
  // Warehouse quantity — this is what actually gates ordering on this page.
  productQuantity?: number;
  productImage?: string;
  productStatus?: string;
  categoryName?: string;
  brandName?: string;
}

interface ProductCategory {
  prodCatLookupId: number;
  productCategory: string;
}

interface ProductBrand {
  prodBrandLookupId: number;
  productBrand: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const CATEGORY_ENDPOINT = `${API_BASE}/api/categories`;
const BRAND_ENDPOINT = `${API_BASE}/api/brands`;

function ProductCard({ product, index }: { product: Product; index: number }) {
  const cardKey = product.productID ?? `product-index-${index}`;
  const targetProductId = product.productID ?? 0;

  const currentStock = product.productQuantity ?? 0;
  const isLowStock = currentStock <= 5;
  const isOutOfStock = currentStock === 0;
  const isUnavailable = product.productStatus === "Not Available";

  return (
    <Link
      key={cardKey}
      href={`/products/${targetProductId}`}
      className={`group relative flex flex-col rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_22px_45px_-20px_rgba(14,165,233,0.15)] ${
        isUnavailable ? "opacity-55 grayscale hover:opacity-75" : ""
      }`}
    >
      {/* Image Holder */}
      <div className="relative mb-4 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
        {product.productImage ? (
          <img
            src={product.productImage}
            alt={product.productModel ?? "Product Image"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1"
            stroke="currentColor"
            className="h-12 w-12 text-slate-300"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        )}

        {isOutOfStock ? (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-rose-600 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-amber-500 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
            Low Warehouse Stock ({currentStock})
          </span>
        ) : null}

        {isUnavailable && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-slate-600 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
            Not Available
          </span>
        )}
      </div>

      {/* Metadata fields: Category, Brand, Code */}
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-slate-400">
        {product.categoryName && (
          <>
            <span className="uppercase tracking-wide text-slate-500">{product.categoryName}</span>
            <span>•</span>
          </>
        )}
        <span className="uppercase text-sky-600 font-semibold">{product.brandName ?? "Generic"}</span>
        <span>•</span>
        <span className="truncate">{product.productCode ?? "N/A"}</span>
      </div>

      {/* Product Title */}
      <h3 className="mt-1 line-clamp-2 min-h-[38px] text-[14px] font-bold text-slate-800 transition group-hover:text-sky-700">
        {product.productModel ?? "Unnamed Product"}
      </h3>

      {/* Price */}
      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Price</p>
          <p className="text-base font-bold text-slate-900">
            {formatCurrency(product.productPrice)}
          </p>
        </div>

        <span className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition group-hover:border-sky-400 group-hover:text-sky-600">
          View
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="h-3 w-3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function ProductListingContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategoryId = searchParams.get("category");
  const activeBrandId = searchParams.get("brand");

  const user = useAuthGuard("supervisor");

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);

  // Live search: filters the already-loaded product list as you type, the
  // same way the Update Product Stock page's search works — no Enter/submit
  // needed and no URL round-trip.
  const [searchInput, setSearchInput] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("");
  const [page, setPage] = useState(1);

  function updateFilterParam(name: "category" | "brand", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
      // Category and brand are mutually exclusive filters: picking one clears the other.
      params.delete(name === "category" ? "brand" : "category");
    } else {
      params.delete(name);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  // --- Fetch category/brand lookups ---
  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch(CATEGORY_ENDPOINT),
          fetch(BRAND_ENDPOINT),
        ]);
        const catData = catRes.ok ? await catRes.json() : [];
        const brandData = brandRes.ok ? await brandRes.json() : [];
        if (!cancelled) {
          setCategories(Array.isArray(catData) ? catData : []);
          setBrands(Array.isArray(brandData) ? brandData : []);
        }
      } catch (err) {
        console.error("Failed to load category/brand lookups", err);
      }
    }

    loadLookups();

    return () => {
      cancelled = true;
    };
  }, []);

  // --- Fetch Products (category/brand filter server-side; search is live/client-side) ---
  useEffect(() => {
    if (!user) return;

    async function fetchFilteredProducts() {
      setLoadingProducts(true);
      try {
        let endpoint = `${API_BASE}/api/products/menu`;

        const hasServerFilters = activeCategoryId || activeBrandId;

        if (hasServerFilters) {
          const queryParams = new URLSearchParams();
          if (activeCategoryId) queryParams.set("category", activeCategoryId);
          if (activeBrandId) queryParams.set("brand", activeBrandId);

          endpoint = `${API_BASE}/api/products/search?${queryParams.toString()}`;
        }

        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchFilteredProducts();
  }, [user, activeCategoryId, activeBrandId]);

  // Live client-side search filter, applied on top of the server-filtered list
  const searchedProducts = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q || p.productModel?.toLowerCase().includes(q) || p.productCode?.toLowerCase().includes(q);
      const matchesAvailability =
        !availabilityFilter ||
        (availabilityFilter === "available" && p.productStatus !== "Not Available") ||
        (availabilityFilter === "unavailable" && p.productStatus === "Not Available");
      return matchesQuery && matchesAvailability;
    });
  }, [products, searchInput, availabilityFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchInput, availabilityFilter, activeCategoryId, activeBrandId]);

  function clearAllFilters() {
    setSearchInput("");
    setAvailabilityFilter("");
    router.push(pathname);
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
        Checking access…
      </div>
    );
  }

  const hasActiveFilters = !!(
    activeCategoryId ||
    activeBrandId ||
    searchInput.trim() ||
    availabilityFilter
  );

  const activeCategoryName =
    categories.find((c) => c.prodCatLookupId.toString() === activeCategoryId)?.productCategory ??
    activeCategoryId;
  const activeBrandName =
    brands.find((b) => b.prodBrandLookupId.toString() === activeBrandId)?.productBrand ??
    activeBrandId;

  // Available products render first; "Not Available" products are grouped below.
  const orderedProducts = [
    ...searchedProducts.filter((p) => p.productStatus !== "Not Available"),
    ...searchedProducts.filter((p) => p.productStatus === "Not Available"),
  ];
  const pagedProducts = paginate(orderedProducts, page);
  const availableProducts = pagedProducts.filter((p) => p.productStatus !== "Not Available");
  const unavailableProducts = pagedProducts.filter((p) => p.productStatus === "Not Available");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] font-sans text-slate-700">
      <Navbar />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

        {/* Header section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              STOCK MANAGEMENT SYSTEM
            </span>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
              Product Directory
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Browse and select products to place a stock order
            </p>
          </div>
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by product code or model…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-700 focus:border-sky-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={activeCategoryId ?? ""}
              onChange={(e) => updateFilterParam("category", e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
            >
              <option value="">Categories</option>
              {categories.map((cat) => (
                <option key={cat.prodCatLookupId} value={cat.prodCatLookupId}>
                  {cat.productCategory}
                </option>
              ))}
            </select>
            <select
              value={activeBrandId ?? ""}
              onChange={(e) => updateFilterParam("brand", e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
            >
              <option value="">Brands</option>
              {brands.map((brand) => (
                <option key={brand.prodBrandLookupId} value={brand.prodBrandLookupId}>
                  {brand.productBrand}
                </option>
              ))}
            </select>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
            >
              <option value="">Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Not Available</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-rose-600 transition hover:border-rose-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Status Bar */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-[13px]">
            <span className="font-semibold text-sky-800">Filtering active:</span>
            {searchInput.trim() && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white border border-sky-200 px-2 py-0.5 text-sky-700">
                Model: "{searchInput.trim()}"
              </span>
            )}
            {activeCategoryId && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white border border-sky-200 px-2 py-0.5 text-sky-700">
                Category: {activeCategoryName}
              </span>
            )}
            {activeBrandId && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white border border-sky-200 px-2 py-0.5 text-sky-700">
                Brand: {activeBrandName}
              </span>
            )}
            {availabilityFilter && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white border border-sky-200 px-2 py-0.5 text-sky-700">
                {availabilityFilter === "available" ? "Available" : "Not Available"}
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="ml-auto font-semibold text-rose-600 hover:underline transition"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Product Catalog Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`loader-${i}`}
                className="h-[320px] rounded-2xl border border-slate-200/60 bg-white p-4 animate-pulse"
              >
                <div className="h-44 w-full rounded-xl bg-slate-100 mb-4" />
                <div className="h-4 w-2/3 bg-slate-100 rounded mb-2" />
                <div className="h-3 w-1/2 bg-slate-100 rounded mb-4" />
                <div className="h-6 w-1/3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : orderedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="mx-auto h-12 w-12 text-slate-300 mb-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
            <h3 className="font-[Barlow_Condensed,sans-serif] text-lg font-bold uppercase text-slate-700">
              No products found
            </h3>
            <p className="mt-1 text-[13px] text-slate-400">
              We couldn't find any items matching your selected criteria.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-4 rounded-lg bg-sky-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-800 transition hover:bg-sky-200"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Available products */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {availableProducts.map((p, index) => (
                <ProductCard key={p.productID ?? `available-${index}`} product={p} index={index} />
              ))}
            </div>

            {/* Not Available products, grouped below with a divider */}
            {unavailableProducts.length > 0 && (
              <>
                <div className="mt-10 mb-4 flex items-center gap-3">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Not Available
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {unavailableProducts.map((p, index) => (
                    <ProductCard key={p.productID ?? `unavailable-${index}`} product={p} index={index} />
                  ))}
                </div>
              </>
            )}

            <Pagination page={page} totalItems={orderedProducts.length} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

export default function SupervisorDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
          Loading catalog setup…
        </div>
      }
    >
      <ProductListingContent />
    </Suspense>
  );
}