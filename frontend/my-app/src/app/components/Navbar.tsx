"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/src/app/contexts/CartContext";

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

const SIDEBAR_LINKS = [
  { label: "Product List", href: "/products" },
  { label: "View Orders", href: "/orders" },
  { label: "Update Product Stock", href: "/products/stock" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { totalCount } = useCart();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(true);

  const [activeDropdown, setActiveDropdown] = useState<"categories" | "brands" | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCategoriesOpen, setSidebarCategoriesOpen] = useState(false);
  const [sidebarBrandsOpen, setSidebarBrandsOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const catRes = await fetch(CATEGORY_ENDPOINT);
        const catData = catRes.ok ? await catRes.json() : [];
        if (!cancelled) setCategories(catData);
      } catch (err) {
        console.error("Failed to load navbar categories", err);
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    }

    async function loadBrands() {
      try {
        const brandRes = await fetch(BRAND_ENDPOINT);
        const brandData = brandRes.ok ? await brandRes.json() : [];
        if (!cancelled) setBrands(brandData);
      } catch (err) {
        console.error("Failed to load navbar brands", err);
      } finally {
        if (!cancelled) setLoadingBrands(false);
      }
    }

    loadCategories();
    loadBrands();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleDropdown(menu: "categories" | "brands") {
    setActiveDropdown((prev) => (prev === menu ? null : menu));
  }

  function createQueryString(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    return params.toString();
  }

  // Category and brand are mutually exclusive filters: picking one clears the other,
  // so selecting a brand doesn't keep a previously-picked category (and vice versa).
  function createFilterQueryString(filterType: "category" | "brand", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(filterType, value);
    params.delete(filterType === "category" ? "brand" : "category");
    return params.toString();
  }

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const currentParams = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      currentParams.set("search", searchTerm.trim());
    } else {
      currentParams.delete("search");
    }
    router.push(`${pathname}?${currentParams.toString()}`);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3.5 sm:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center gap-[5px] rounded-lg border border-slate-200 bg-slate-50 transition hover:border-sky-300 hover:bg-sky-400/10"
          >
            <span className="h-[2px] w-5 rounded-full bg-slate-600" />
            <span className="h-[2px] w-5 rounded-full bg-slate-600" />
            <span className="h-[2px] w-5 rounded-full bg-slate-600" />
          </button>

          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-400/15">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4 flex-shrink-0 text-slate-400"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products, model, or code…"
                className="w-full bg-transparent text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </form>

          <Link
            href="/cart"
            aria-label="View cart"
            className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-sky-300 hover:bg-sky-400/10 hover:text-sky-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.895-4.706 2.298-7.184a1.125 1.125 0 0 0-1.108-1.316H5.213M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {totalCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sky-600 px-1 font-mono text-[10px] font-bold text-white">
                {totalCount}
              </span>
            )}
          </Link>

          <div className="hidden flex-col items-end gap-0.5 sm:flex">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
              Panel
            </span>
            <span className="font-mono text-xs tracking-[0.08em] text-sky-600">SUPERVISOR</span>
          </div>
        </div>

        <nav ref={navRef} className="relative border-t border-slate-100">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-2 sm:px-8">
            <button
              type="button"
              onClick={() => toggleDropdown("categories")}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-condensed text-[14px] font-semibold uppercase tracking-wide transition ${
                activeDropdown === "categories"
                  ? "bg-[#1f3b57] text-slate-50"
                  : "text-slate-600 hover:bg-sky-400/10 hover:text-sky-700"
              }`}
            >
              Categories
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className={`h-3 w-3 transition-transform ${activeDropdown === "categories" ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => toggleDropdown("brands")}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-condensed text-[14px] font-semibold uppercase tracking-wide transition ${
                activeDropdown === "brands"
                  ? "bg-[#1f3b57] text-slate-50"
                  : "text-slate-600 hover:bg-sky-400/10 hover:text-sky-700"
              }`}
            >
              Brands
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className={`h-3 w-3 transition-transform ${activeDropdown === "brands" ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          {activeDropdown !== null && (
            <div className="absolute left-0 right-0 top-full z-50 border-t border-slate-100 bg-white shadow-[0_30px_60px_-15px_rgba(15,23,42,0.15)] transition-all">
              <div className="mx-auto max-w-7xl px-8 py-6">
                
                {activeDropdown === "categories" && (
                  <div>
                    {loadingCategories ? (
                      <p className="text-[13px] text-slate-400 animate-pulse">Loading categories…</p>
                    ) : categories.length === 0 ? (
                      <p className="text-[13px] text-slate-400 italic">No categories available.</p>
                    ) : (
                      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {categories.map((cat) => (
                          <li key={cat.prodCatLookupId}>
                            <Link
                              /* FIXED: Passing numeric lookup ID instead of name string */
                              href={`${pathname}?${createFilterQueryString("category", cat.prodCatLookupId.toString())}`}
                              onClick={() => setActiveDropdown(null)}
                              className="block truncate rounded-lg border border-slate-100 bg-white px-4 py-3 text-left text-[13.5px] font-medium text-slate-600 transition hover:border-sky-100 hover:bg-sky-50/50 hover:text-sky-700"
                            >
                              {cat.productCategory}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {activeDropdown === "brands" && (
                  <div>
                    {loadingBrands ? (
                      <p className="text-[13px] text-slate-400 animate-pulse">Loading brands…</p>
                    ) : brands.length === 0 ? (
                      <p className="text-[13px] text-slate-400 italic">No brands available.</p>
                    ) : (
                      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {brands.map((brand) => (
                          <li key={brand.prodBrandLookupId}>
                            <Link
                              /* FIXED: Passing numeric lookup ID instead of name string */
                              href={`${pathname}?${createFilterQueryString("brand", brand.prodBrandLookupId.toString())}`}
                              onClick={() => setActiveDropdown(null)}
                              className="block truncate rounded-lg border border-slate-100 bg-white px-4 py-3 text-left text-[13.5px] font-medium text-slate-600 transition hover:border-sky-100 hover:bg-sky-50/50 hover:text-sky-700"
                            >
                              {brand.productBrand}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </nav>
      </header>

      {/* ---------- Sidebar Drawer ---------- */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-slate-900/30 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          
          <aside className="flex h-full w-[300px] flex-col border-l border-slate-200 bg-white p-6 shadow-[0_30px_60px_-25px_rgba(51,65,60,0.25)]">
            <div className="mb-6 flex flex-shrink-0 items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  System
                </span>
                <span className="font-mono text-xs tracking-[0.08em] text-sky-600">
                  STOCK-MGMT
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-sky-300 hover:bg-sky-400/10"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-shrink-0 flex-col gap-1">
              {SIDEBAR_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg px-3 py-2.5 font-condensed text-[15px] font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-sky-400/10 hover:text-sky-700"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 flex-1 overflow-y-auto pr-1 border-t border-dashed border-slate-200 pt-4 custom-scrollbar">
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setSidebarCategoriesOpen(!sidebarCategoriesOpen)}
                  className="flex w-full items-center justify-between py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400 hover:text-slate-600 transition"
                >
                  <span>Categories</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className={`h-3 w-3 text-slate-400 transition-transform ${sidebarCategoriesOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                
                {sidebarCategoriesOpen && (
                  <div className="mt-1 flex flex-col gap-1 pl-2 border-l border-slate-100">
                    {loadingCategories ? (
                      <span className="px-3 py-1 text-xs text-slate-400">Loading…</span>
                    ) : categories.length === 0 ? (
                      <span className="px-3 py-1 text-xs text-slate-400">No categories</span>
                    ) : (
                      categories.map((cat) => (
                        <Link
                          key={cat.prodCatLookupId}
                          /* FIXED: Passing numeric lookup ID instead of name string */
                          href={`${pathname}?${createFilterQueryString("category", cat.prodCatLookupId.toString())}`}
                          onClick={() => setSidebarOpen(false)}
                          className="rounded-lg px-3 py-2 text-left text-[13.5px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-sky-700"
                        >
                          {cat.productCategory}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setSidebarBrandsOpen(!sidebarBrandsOpen)}
                  className="flex w-full items-center justify-between py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400 hover:text-slate-600 transition"
                >
                  <span>Brands</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className={`h-3 w-3 text-slate-400 transition-transform ${sidebarBrandsOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {sidebarBrandsOpen && (
                  <div className="mt-1 flex flex-col gap-1 pl-2 border-l border-slate-100">
                    {loadingBrands ? (
                      <span className="px-3 py-1 text-xs text-slate-400">Loading…</span>
                    ) : brands.length === 0 ? (
                      <span className="px-3 py-1 text-xs text-slate-400">No brands</span>
                    ) : (
                      brands.map((brand) => (
                        <Link
                          key={brand.prodBrandLookupId}
                          /* FIXED: Passing numeric lookup ID instead of name string */
                          href={`${pathname}?${createFilterQueryString("brand", brand.prodBrandLookupId.toString())}`}
                          onClick={() => setSidebarOpen(false)}
                          className="rounded-lg px-3 py-2 text-left text-[13.5px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-sky-700"
                        >
                          {brand.productBrand}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
