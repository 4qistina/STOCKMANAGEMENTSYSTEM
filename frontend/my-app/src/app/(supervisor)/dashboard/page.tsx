"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/src/app/components/Navbar";
import { useAuthGuard } from "@/src/lib/useAuthGuard";
import { useCart } from "@/src/app/contexts/CartContext";
import { formatCurrency } from "@/src/lib/format";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// Matches the threshold used on the Update Product Stock page so "low
// stock" means the same thing everywhere in the app.
const LOW_STOCK_THRESHOLD = 5;

interface Product {
  productID: number;
  productCode: string;
  productModel: string;
  productPrice: number;
  handInStock: number;
  productStatus: string;
  categoryName?: string | null;
}

interface Order {
  orderID: number;
  orderNumber: string;
  orderDate: string;
  orderStatus: string; // "Pending" | "Available" (Available == Approved)
  deliveredDate: string | null;
}

function isPending(order: Order) {
  return order.orderStatus?.trim().toLowerCase() === "pending";
}

export default function SupervisorDashboard() {
  const user = useAuthGuard("supervisor");
  const { items, distinctCount, totalCount, totalPrice } = useCart();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This is where retail-side stock visibility and order history live —
  // the Warehouse dashboard deliberately does NOT show this, since watching
  // stock and deciding when to reorder is the Supervisor's job, not
  // Warehouse Staff's.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [stockRes, activeRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/api/stock/list`),
          fetch(`${API_BASE}/api/orders/active/${user?.userId}`),
          fetch(`${API_BASE}/api/orders/history/${user?.userId}`),
        ]);
        if (!stockRes.ok || !activeRes.ok || !historyRes.ok) {
          throw new Error("Failed to load dashboard data");
        }
        const [stock, active, history]: [Product[], Order[], Order[]] = await Promise.all([
          stockRes.json(),
          activeRes.json(),
          historyRes.json(),
        ]);

        if (cancelled) return;
        setProducts(stock);

        const merged = new Map<number, Order>();
        [...active, ...history].forEach((o) => merged.set(o.orderID, o));
        setOrders(Array.from(merged.values()));
      } catch (err) {
        if (!cancelled) {
          setError("Couldn't load live dashboard data. Please refresh.");
          console.error("Dashboard load failed:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ---- Derived analytics — all computed from real API data ----
  const lowStockProducts = useMemo(
    () => (products ?? []).filter((p) => p.handInStock > 0 && p.handInStock <= LOW_STOCK_THRESHOLD),
    [products]
  );
  const outOfStockProducts = useMemo(() => (products ?? []).filter((p) => p.handInStock === 0), [products]);

  const restockList = useMemo(
    () => [...outOfStockProducts, ...lowStockProducts].sort((a, b) => a.handInStock - b.handInStock).slice(0, 6),
    [outOfStockProducts, lowStockProducts]
  );

  const stockByCategory = useMemo(() => {
    const map = new Map<string, number>();
    (products ?? []).forEach((p) => {
      const key = p.categoryName || "Uncategorized";
      map.set(key, (map.get(key) ?? 0) + Number(p.handInStock ?? 0));
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [products]);

  const pending = useMemo(() => (orders ?? []).filter((o) => !o.deliveredDate && isPending(o)), [orders]);
  const approvedActive = useMemo(() => (orders ?? []).filter((o) => !o.deliveredDate && !isPending(o)), [orders]);
  const delivered = useMemo(() => (orders ?? []).filter((o) => !!o.deliveredDate), [orders]);

  const maxCategoryStock = Math.max(1, ...stockByCategory.map(([, v]) => v));
  const orderPipelineTotal = Math.max(1, pending.length + approvedActive.length + delivered.length);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
        Checking access…
      </div>
    );
  }

  const stats = [
    { label: "Low Stock Items", value: loading ? "—" : String(lowStockProducts.length) },
    { label: "Out of Stock", value: loading ? "—" : String(outOfStockProducts.length) },
    { label: "Items in Cart", value: String(distinctCount) },
    { label: "Orders in Progress", value: loading ? "—" : String(pending.length + approvedActive.length) },
  ];

  const quickActions = [
    { title: "Browse Products", desc: "Search and filter the product catalogue", href: "/products" },
    { title: "View Cart", desc: "Review items before placing an order", href: "/cart" },
    { title: "Update Product Stock", desc: "Check and adjust on-hand stock counts", href: "/products/stock" },
    { title: "View Orders", desc: "Track your active orders and order history", href: "/orders" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] font-sans text-slate-700">
      <Navbar />
      <div className="px-6 py-8">
        <div className="mx-auto max-w-5xl">
          {/* Top bar */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
                Supervisor Dashboard
              </span>
              <h1 className="font-[Barlow_Condensed,sans-serif] text-2xl font-bold uppercase tracking-wide text-slate-800">
                Welcome, {user.userFullname}
              </h1>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-3 text-[12.5px] font-medium text-rose-600">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.25)]"
              >
                <p className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold text-slate-800">{s.value}</p>
                <p className="mt-1 text-[12.5px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Insights */}
          <h2 className="mb-3 font-[Barlow_Condensed,sans-serif] text-sm font-semibold uppercase tracking-wider text-slate-400">
            Insights
          </h2>
          <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center text-[12.5px] text-slate-400 lg:col-span-2">
                Loading live dashboard data…
              </div>
            ) : (
              <>
                {/* Stock by category */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.25)]">
                  <p className="font-[Barlow_Condensed,sans-serif] text-base font-semibold text-slate-800">
                    Stock by Category
                  </p>
                  <p className="mb-4 text-[12.5px] text-slate-400">Units currently on hand at this location</p>
                  {stockByCategory.length === 0 ? (
                    <p className="text-[12.5px] text-slate-400">No product data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {stockByCategory.map(([name, value]) => (
                        <div key={name}>
                          <div className="mb-1 flex items-center justify-between text-[12.5px]">
                            <span className="text-slate-500">{name}</span>
                            <span className="font-semibold text-slate-700">{value} units</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-sky-500"
                              style={{ width: `${Math.max(2, (value / maxCategoryStock) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* My order pipeline */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.25)]">
                  <p className="font-[Barlow_Condensed,sans-serif] text-base font-semibold text-slate-800">
                    My Orders
                  </p>
                  <p className="mb-4 text-[12.5px] text-slate-400">Status of the orders you've placed</p>
                  <div className="space-y-3">
                    {[
                      { label: "Pending", value: pending.length, color: "bg-amber-400" },
                      { label: "Approved · Awaiting Delivery", value: approvedActive.length, color: "bg-sky-500" },
                      { label: "Delivered", value: delivered.length, color: "bg-slate-700" },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="mb-1 flex items-center justify-between text-[12.5px]">
                          <span className="text-slate-500">{row.label}</span>
                          <span className="font-semibold text-slate-700">{row.value}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${row.color}`}
                            style={{ width: `${Math.max(2, (row.value / orderPipelineTotal) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/orders"
                    className="mt-3 inline-block text-[12px] font-semibold text-sky-600 hover:underline"
                  >
                    View all orders →
                  </Link>
                </div>

                {/* Needs restocking */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.25)]">
                  <p className="font-[Barlow_Condensed,sans-serif] text-base font-semibold text-slate-800">
                    Needs Restocking
                  </p>
                  <p className="mb-4 text-[12.5px] text-slate-400">Lowest stock items — consider ordering more</p>
                  {restockList.length === 0 ? (
                    <p className="text-[12.5px] text-slate-400">Everything&apos;s well stocked.</p>
                  ) : (
                    <ul className="space-y-2">
                      {restockList.map((p) => (
                        <li
                          key={p.productID}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${p.handInStock === 0 ? "bg-rose-500" : "bg-amber-400"}`}
                            />
                            <span className="text-[12.5px] font-medium text-slate-700">{p.productModel}</span>
                          </div>
                          <span
                            className={`text-[12px] font-semibold ${
                              p.handInStock === 0 ? "text-rose-600" : "text-amber-700"
                            }`}
                          >
                            {p.handInStock === 0 ? "Out of stock" : `${p.handInStock} left`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/products"
                    className="mt-3 inline-block text-[12px] font-semibold text-sky-600 hover:underline"
                  >
                    Browse products →
                  </Link>
                </div>

                {/* Cart summary */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.25)]">
                  <p className="font-[Barlow_Condensed,sans-serif] text-base font-semibold text-slate-800">
                    Cart Summary
                  </p>
                  <p className="mb-4 text-[12.5px] text-slate-400">Ready to submit as your next order</p>
                  {items.length === 0 ? (
                    <p className="text-[12.5px] text-slate-400">Your cart is empty.</p>
                  ) : (
                    <ul className="mb-3 space-y-2">
                      {items.slice(0, 4).map((i) => (
                        <li
                          key={i.productID}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                        >
                          <span className="text-[12.5px] font-medium text-slate-700">
                            {i.productModel} <span className="text-slate-400">× {i.quantity}</span>
                          </span>
                          <span className="text-[12px] font-semibold text-slate-500">
                            {formatCurrency(i.productPrice * i.quantity)}
                          </span>
                        </li>
                      ))}
                      {items.length > 4 && (
                        <li className="text-[12px] text-slate-400">+ {items.length - 4} more item(s)</li>
                      )}
                    </ul>
                  )}
                  <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                    <span className="text-[12.5px] text-slate-500">{totalCount} unit(s) total</span>
                    <span className="font-[Barlow_Condensed,sans-serif] text-lg font-bold text-slate-800">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  <Link
                    href="/cart"
                    className="mt-3 inline-block text-[12px] font-semibold text-sky-600 hover:underline"
                  >
                    Go to cart →
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Quick actions */}
          <h2 className="mb-3 font-[Barlow_Condensed,sans-serif] text-sm font-semibold uppercase tracking-wider text-slate-400">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quickActions.map((a) => (
              <Link
                key={a.title}
                href={a.href}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:bg-sky-50"
              >
                <p className="font-[Barlow_Condensed,sans-serif] text-base font-semibold text-slate-800">{a.title}</p>
                <p className="mt-1 text-[12.5px] text-slate-400">{a.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}