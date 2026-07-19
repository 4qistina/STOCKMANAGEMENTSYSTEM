"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Maintain Product", href: "/warehouse/maintain-products" },
  { label: "Categories", href: "/warehouse/categories" },
  { label: "Brands", href: "/warehouse/brands" },
  { label: "Order Details", href: "/warehouse/orders" },
  { label: "Drivers", href: "/warehouse/drivers" },
  { label: "Delivery Info", href: "/warehouse/delivery" },
];

export default function WarehouseNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("user");
    router.replace("/login");
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">System</span>
            <span className="font-mono text-xs tracking-[0.08em] text-sky-600">STOCK-MGMT</span>
          </div>

          <div className="hidden flex-col items-end gap-0.5 sm:flex">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">Panel</span>
            <span className="font-mono text-xs tracking-[0.08em] text-sky-600">WAREHOUSE STAFF</span>
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
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">System</span>
                <span className="font-mono text-xs tracking-[0.08em] text-sky-600">STOCK-MGMT</span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-sky-300 hover:bg-sky-400/10"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1">
              {SIDEBAR_LINKS.map((link) => {
                const active = pathname === link.href || pathname?.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`rounded-lg px-3 py-2.5 font-condensed text-[15px] font-semibold uppercase tracking-wide transition ${
                      active
                        ? "bg-[#1f3b57] text-slate-50"
                        : "text-slate-700 hover:bg-sky-400/10 hover:text-sky-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex-shrink-0 rounded-lg border border-slate-200 bg-white py-2.5 text-[13px] font-bold uppercase tracking-wide text-rose-500 transition hover:border-rose-300 hover:bg-rose-50"
            >
              Log out
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
