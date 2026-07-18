"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";

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

function WarehouseProductListContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategoryId = searchParams.get("category");
  const activeBrandId = searchParams.get("brand");

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let cancelled = false;
    async function loadLookups() {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch(`${API_BASE}/api/categories`),
          fetch(`${API_BASE}/api/brands`),
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

  useEffect(() => {
    if (checkingAuth || !user) return;
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      try {
        // 1.1 Supervisor/Warehouse selects the "Product" menu option
        const res = await fetch(`${API_BASE}/api/products/menu`);
        const data = res.ok ? await res.json() : [];
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [checkingAuth, user]);

  if (checkingAuth || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
        Checking access…
      </div>
    );
  }

  // 1.2 Supervisor/Warehouse select Category and Brand of the Products (client-side filter)
  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = !activeCategoryId || String(p.prodCatLookupId) === activeCategoryId;
    const matchesBrand = !activeBrandId || String(p.prodBrandLookupId) === activeBrandId;
    return matchesCategory && matchesBrand;
  });

  function setFilter(type: "category" | "brand", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(type, value);
    else params.delete(type);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] px-5 py-8 sm:px-8 font-sans text-slate-700">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              WAREHOUSE STAFF
            </span>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
              Product Details
            </h1>
          </div>

          {/* 1.2 Filter by Category and Brand */}
          <div className="flex flex-wrap gap-2">
            <select
              value={activeCategoryId ?? ""}
              onChange={(e) => setFilter("category", e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.prodCatLookupId} value={c.prodCatLookupId}>
                  {c.productCategory}
                </option>
              ))}
            </select>
            <select
              value={activeBrandId ?? ""}
              onChange={(e) => setFilter("brand", e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-600 focus:border-sky-400 focus:outline-none"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.prodBrandLookupId} value={b.prodBrandLookupId}>
                  {b.productBrand}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200/60 bg-white" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // [E1: No Results Found]
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
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.productID} className="transition hover:bg-sky-50/40">
                    <td className="px-5 py-3 font-mono text-[12px] text-slate-500">{p.productCode}</td>
                    <td className="px-5 py-3 text-slate-600">{p.categoryName ?? "—"}</td>
                    <td className="px-5 py-3 font-semibold text-sky-700">{p.brandName ?? "Generic"}</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{p.productModel}</td>
                    <td className="px-5 py-3 text-slate-600">${Number(p.productPrice).toFixed(2)}</td>
                    <td className="px-5 py-3 text-slate-600">{p.handInStock}</td>
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
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/warehouse/products/${p.productID}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WarehouseProductListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
          Loading…
        </div>
      }
    >
      <WarehouseProductListContent />
    </Suspense>
  );
}
