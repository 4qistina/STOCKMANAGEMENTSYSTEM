"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/app/contexts/CartContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<{ orderNumber: string } | null>(null);

  async function handleConfirmOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      if (!user?.userId) throw new Error("Missing user session. Please log in again.");

      // [E2] Re-check quantities before submitting, in case they were edited on this page
      const invalidQuantity = items.find((i) => !i.quantity || i.quantity <= 0);
      if (invalidQuantity) {
        throw new Error("Please enter a value greater than 0");
      }
      const overStock = items.find((i) => i.quantity > i.handInStock);
      if (overStock) {
        throw new Error(`Only ${overStock.handInStock} unit(s) of "${overStock.productModel}" left in stock.`);
      }

      const res = await fetch(`${API_BASE}/api/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          items: items.map((i) => ({ productId: i.productID, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      setOrderSummary({ orderNumber: data.orderNumber });
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (orderSummary) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-7 w-7"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="font-[Barlow_Condensed,sans-serif] text-2xl font-bold uppercase text-slate-800">
          Order Placed Successfully
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Order number: <strong className="text-slate-700">{orderSummary.orderNumber}</strong>
        </p>
        <button
          onClick={() => router.push("/products")}
          className="mt-6 rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-sky-700"
        >
          Back to Product List
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-sm text-slate-400">Your cart is empty.</p>
        <button
          onClick={() => router.push("/products")}
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:border-sky-300 hover:text-sky-700"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <h1 className="mb-6 font-[Barlow_Condensed,sans-serif] text-2xl font-bold uppercase text-slate-800">
        Review Your Cart
      </h1>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.productID}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">{item.productModel}</p>
              <p className="text-xs text-slate-400">{item.productCode}</p>
              {item.quantity > item.handInStock && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">
                  Only {item.handInStock} in stock — please reduce quantity
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={1}
                max={item.handInStock}
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productID, Number(e.target.value))}
                className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
              />
              <p className="w-20 text-right text-sm font-bold text-slate-900">
                ${(item.quantity * item.productPrice).toFixed(2)}
              </p>
              <button
                onClick={() => removeItem(item.productID)}
                aria-label="Remove item"
                className="text-rose-500 transition hover:text-rose-700"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm font-bold text-slate-600">Total</span>
        <span className="text-lg font-bold text-slate-900">${totalPrice.toFixed(2)}</span>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

      <button
        onClick={() => setConfirming(true)}
        className="mt-6 w-full rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-sky-700"
      >
        Make Order
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Confirm Order</h3>
            <p className="mt-2 text-sm text-slate-500">
              Place an order for {items.length} item(s) totaling ${totalPrice.toFixed(2)}?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={submitting}
                className="flex-1 rounded-lg bg-sky-600 py-2.5 text-xs font-bold uppercase text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? "Placing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
