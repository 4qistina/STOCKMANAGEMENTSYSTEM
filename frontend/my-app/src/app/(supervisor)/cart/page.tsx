"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/src/app/contexts/CartContext";
import { formatCurrency } from "@/src/lib/format";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// Shelf stock at or below this is flagged as a restock candidate on the cart page.
const LOW_STOCK_THRESHOLD = 5;

interface SuggestibleProduct {
  productID: number;
  productCode?: string;
  productModel?: string;
  productPrice?: number;
  handInStock?: number;
  productQuantity?: number;
  productImage?: string;
  productStatus?: string;
  categoryName?: string;
  brandName?: string;
}

function Stepper({
  value,
  max = 999,
  onChange,
}: {
  value: number;
  max?: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:text-sky-600"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-12 border-x border-slate-200 bg-transparent py-1.5 text-center text-sm font-semibold text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:text-sky-600"
      >
        +
      </button>
    </div>
  );
}

function RestockSuggestions({
  products,
  loading,
  addedIds,
  onAdd,
}: {
  products: SuggestibleProduct[];
  loading: boolean;
  addedIds: Set<number>;
  onAdd: (product: SuggestibleProduct) => void;
}) {
  if (loading || products.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 sm:p-5">
      <div className="flex items-start gap-2.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="mt-0.5 h-4.5 w-4.5 flex-shrink-0 text-amber-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-8.25 3.75h.008v.008h-.008v-.008Z"
          />
        </svg>
        <div>
          <p className="text-[13px] font-bold text-amber-800">Running low on the shelf</p>
          <p className="text-[12px] text-amber-700">
            These items are below {LOW_STOCK_THRESHOLD} units in stock. Do you wish to restock any of them?
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {products.map((p) => {
          const added = addedIds.has(p.productID);
          return (
            <div
              key={p.productID}
              className="flex w-44 flex-shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-3"
            >
              <Link
                href={`/products/${p.productID}`}
                className="mb-2 flex h-20 w-full items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
              >
                {p.productImage ? (
                  <img src={p.productImage} alt={p.productModel ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1"
                    stroke="currentColor"
                    className="h-7 w-7 text-slate-300"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                )}
              </Link>

              <p className="line-clamp-2 min-h-[32px] text-[12px] font-bold text-slate-800">
                {p.productModel ?? "Unnamed Product"}
              </p>

              <span className="mt-1 inline-flex w-fit items-center rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700">
                {p.handInStock ?? 0} on shelf
              </span>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[12.5px] font-bold text-slate-900">{formatCurrency(p.productPrice)}</p>
                <button
                  onClick={() => onAdd(p)}
                  disabled={added}
                  className={`rounded-md px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-white transition ${
                    added ? "bg-emerald-600" : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  {added ? "Added ✓" : "+ Add"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<{ orderNumber: string } | null>(null);

  // --- Restock suggestions (products low on shelf stock, not already in cart) ---
  const [allProducts, setAllProducts] = useState<SuggestibleProduct[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [addedSuggestionIds, setAddedSuggestionIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`${API_BASE}/api/products/menu`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAllProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load restock suggestions:", err);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }

    loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    const cartIds = new Set(items.map((i) => i.productID));
    return allProducts
      .filter((p) => !cartIds.has(p.productID))
      .filter((p) => p.productStatus !== "Not Available")
      .filter((p) => (p.productQuantity ?? 0) > 0)
      .filter((p) => (p.handInStock ?? 0) <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => (a.handInStock ?? 0) - (b.handInStock ?? 0))
      .slice(0, 8);
  }, [allProducts, items]);

  function handleAddSuggestion(product: SuggestibleProduct) {
    const result = addItem(
      {
        productID: product.productID,
        productCode: product.productCode,
        productModel: product.productModel,
        productPrice: Number(product.productPrice ?? 0),
        productImage: product.productImage,
        handInStock: product.handInStock ?? 0,
        productQuantity: product.productQuantity ?? 0,
        productStatus: product.productStatus,
      },
      1
    );
    if (result.ok) {
      setAddedSuggestionIds((prev) => new Set(prev).add(product.productID));
    }
  }

  // Which cart items the supervisor wants to include in this order.
  // Everything starts selected so behavior matches the old "whole cart" flow
  // unless they deliberately uncheck something.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(items.map((i) => i.productID))
  );

  // Newly-added items (e.g. via a restock suggestion) should default to selected too.
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      items.forEach((i) => next.add(i.productID));
      return next;
    });
  }, [items]);

  function toggleItem(productID: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productID)) next.delete(productID);
      else next.add(productID);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.productID))
    );
  }

  const selectedItems = items.filter((i) => selectedIds.has(i.productID));
  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const selectedTotal = selectedItems.reduce((sum, i) => sum + i.quantity * i.productPrice, 0);

  async function handleConfirmOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      if (!user?.userId) throw new Error("Missing user session. Please log in again.");

      if (selectedItems.length === 0) {
        throw new Error("Select at least one item to order.");
      }

      // [E2] Re-check quantities before submitting, in case they were edited on this page
      const invalidQuantity = selectedItems.find((i) => !i.quantity || i.quantity <= 0);
      if (invalidQuantity) {
        throw new Error("Please enter a value greater than 0");
      }

      // Can't order more than the warehouse currently has on hand
      const overWarehouseStock = selectedItems.find((i) => i.quantity > (i.productQuantity ?? 0));
      if (overWarehouseStock) {
        throw new Error(
          `Only ${overWarehouseStock.productQuantity} unit(s) of "${overWarehouseStock.productModel}" are available from the warehouse.`
        );
      }

      const res = await fetch(`${API_BASE}/api/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          items: selectedItems.map((i) => ({ productId: i.productID, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      setOrderSummary({ orderNumber: data.orderNumber });
      // Only clear the items that were actually ordered — anything left
      // unchecked stays in the cart for later.
      selectedItems.forEach((i) => removeItem(i.productID));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  // ---- Success state ----
  if (orderSummary) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] px-5 py-8 sm:px-8 font-sans text-slate-700">
        <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-slate-200/60 bg-white p-10 text-center shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
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
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
            Order Confirmed
          </span>
          <h2 className="mt-1 font-[Barlow_Condensed,sans-serif] text-2xl font-bold uppercase text-slate-800">
            Order Placed Successfully
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Order number: <strong className="text-slate-700">{orderSummary.orderNumber}</strong>
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/orders"
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
            >
              View My Orders
            </Link>
            <button
              onClick={() => router.push("/products")}
              className="rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-sky-700"
            >
              Back to Product List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Empty state ----
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] px-5 py-8 sm:px-8 font-sans text-slate-700">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              STOCK MANAGEMENT SYSTEM
            </span>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
              Cart
            </h1>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="mx-auto h-12 w-12 text-slate-300 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.895-4.706 2.298-7.184a1.125 1.125 0 0 0-1.108-1.316H5.213M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
            <h3 className="font-[Barlow_Condensed,sans-serif] text-lg font-bold uppercase text-slate-700">
              Your cart is empty
            </h3>
            <p className="mt-1 text-[13px] text-slate-400">Add products from the catalog to get started.</p>
            <Link
              href="/products"
              className="mt-4 rounded-lg bg-sky-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-800 transition hover:bg-sky-200"
            >
              Browse Products
            </Link>
          </div>

          <RestockSuggestions
            products={suggestions}
            loading={loadingSuggestions}
            addedIds={addedSuggestionIds}
            onAdd={handleAddSuggestion}
          />
        </div>
      </div>
    );
  }

  // ---- Cart with items ----
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] px-5 py-8 sm:px-8 font-sans text-slate-700">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/products"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition hover:text-sky-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="h-3.5 w-3.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Product Directory
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              STOCK MANAGEMENT SYSTEM
            </span>
            <h1 className="font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase tracking-wide text-slate-800">
              Review Your Cart
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
              <input
                type="checkbox"
                checked={items.length > 0 && selectedIds.size === items.length}
                ref={(el) => {
                  if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < items.length;
                }}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
              />
              Select all
            </label>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-bold text-slate-500">
              {selectedCount} item{selectedCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.productID}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)] sm:flex-row sm:items-center sm:p-5"
            >
              {/* Select */}
              <label className="flex flex-shrink-0 items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.productID)}
                  onChange={() => toggleItem(item.productID)}
                  aria-label={`Select ${item.productModel}`}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                />
              </label>

              {/* Image */}
              <Link
                href={`/products/${item.productID}`}
                className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 transition hover:border-sky-200"
              >
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productModel} className="h-full w-full object-cover" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1"
                    stroke="currentColor"
                    className="h-8 w-8 text-slate-300"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                )}
              </Link>

              {/* Product detail: name, code, availability */}
              <div className="min-w-0 flex-1 sm:flex-none sm:w-48">
                <Link
                  href={`/products/${item.productID}`}
                  className="line-clamp-2 text-sm font-bold text-slate-800 transition hover:text-sky-700"
                >
                  {item.productModel || "Unnamed Product"}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-400">
                  <span>{item.productCode ?? "N/A"}</span>
                  <span>•</span>
                  {item.productStatus === "Not Available" ? (
                    <span className="font-semibold text-slate-500">Not Available</span>
                  ) : item.productQuantity === 0 ? (
                    <span className="font-semibold text-rose-600">Out of Stock</span>
                  ) : (
                    <span className="font-semibold text-emerald-600">
                      {item.productQuantity} available from warehouse
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400 sm:hidden">
                  {formatCurrency(item.productPrice)} each
                </p>
              </div>

              {/* Quantity + subtotal, grouped and right-aligned; remove sits at the far end */}
              <div className="flex flex-1 items-center justify-end gap-4">
                <Stepper
                  value={item.quantity}
                  max={item.productQuantity || 1}
                  onChange={(next) => updateQuantity(item.productID, next)}
                />
                <p className="w-20 text-right text-sm font-bold text-slate-900">
                  {formatCurrency(item.quantity * item.productPrice)}
                </p>
                <button
                  onClick={() => removeItem(item.productID)}
                  aria-label="Remove item"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <RestockSuggestions
          products={suggestions}
          loading={loadingSuggestions}
          addedIds={addedSuggestionIds}
          onAdd={handleAddSuggestion}
        />

        {/* Summary */}
        <div className="mt-6 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Total ({selectedCount} selected)
            </span>
            <span className="text-xl font-bold text-slate-900">{formatCurrency(selectedTotal)}</span>
          </div>

          {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

          <button
            onClick={() => setConfirming(true)}
            disabled={selectedItems.length === 0}
            className="mt-5 w-full rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Make Order
          </button>
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              Confirmation
            </span>
            <h3 className="mt-1 font-[Barlow_Condensed,sans-serif] text-xl font-bold uppercase text-slate-800">
              Confirm Order
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Place an order for {selectedCount} item{selectedCount === 1 ? "" : "s"} totaling{" "}
              {formatCurrency(selectedTotal)}?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase text-slate-500 transition hover:border-slate-300 disabled:opacity-50"
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