"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Products", href: "/warehouse/products" },
  { label: "Maintain Product", href: "/warehouse/maintain-products" },
  { label: "Categories", href: "/warehouse/categories" },
  { label: "Brands", href: "/warehouse/brands" },
  { label: "Order Status", href: "/warehouse/order-status" },
  { label: "Order Details", href: "/warehouse/orders" },
  { label: "Drivers", href: "/warehouse/drivers" },
  { label: "Delivery Info", href: "/warehouse/delivery" },
];

export default function WarehouseNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("user");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-5 py-3 sm:px-8">
        <div className="mr-4 flex-shrink-0 flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">System</span>
          <span className="font-mono text-[11px] tracking-[0.08em] text-sky-600">STOCK-MGMT</span>
        </div>

        <nav className="flex flex-1 items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 font-[Barlow_Condensed,sans-serif] text-[13.5px] font-semibold uppercase tracking-wide transition ${
                  active ? "bg-[#1f3b57] text-slate-50" : "text-slate-600 hover:bg-sky-400/10 hover:text-sky-700"
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
          className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
