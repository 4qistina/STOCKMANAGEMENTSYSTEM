"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/app/contexts/CartContext";

// Search and the Categories/Brands pickers used to live here, but now live on
// the Products page itself (search/filtering only makes sense there) — the
// navbar stays focused on navigation, cart, and account actions on every page.
const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Product List", href: "/products" },
  { label: "View Orders", href: "/orders" },
  { label: "Update Product Stock", href: "/products/stock" },
];

export default function Navbar() {
  const router = useRouter();
  const { distinctCount } = useCart();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("user");
    document.cookie = "role=; path=/; max-age=0";
    router.replace("/");
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

          <div className="flex flex-1 flex-col gap-0.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
              System
            </span>
            <span className="font-mono text-xs tracking-[0.08em] text-sky-600">STOCK-MGMT</span>
          </div>

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
            {distinctCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sky-600 px-1 font-mono text-[10px] font-bold text-white">
                {distinctCount}
              </span>
            )}
          </Link>

          <div className="hidden flex-col items-end gap-0.5 sm:flex">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
              Panel
            </span>
            <span className="font-mono text-xs tracking-[0.08em] text-sky-600">SUPERVISOR</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
          >
            Log out
          </button>
        </div>
      </header>

      {/* ---------- Sidebar Drawer (opens on the left, by the hamburger button) ---------- */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="flex h-full w-[300px] flex-col border-r border-slate-200 bg-white p-6 shadow-[0_30px_60px_-25px_rgba(51,65,60,0.25)]">
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

            <div className="mt-auto flex-shrink-0 border-t border-dashed border-slate-200 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-[13px] font-bold uppercase tracking-wide text-rose-500 transition hover:border-rose-300 hover:bg-rose-50"
              >
                Log out
              </button>
            </div>
          </aside>

          <div
            className="flex-1 bg-slate-900/30 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}
    </>
  );
}