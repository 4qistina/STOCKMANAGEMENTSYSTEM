"use client";

import { useState } from "react";
import { useCart, CartItem } from "@/src/app/contexts/CartContext";

interface AddToCartControlProps {
  product: Omit<CartItem, "quantity">;
}

export default function AddToCartControl({ product }: AddToCartControlProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const isUnavailable = product.productStatus === "Not Available" || product.handInStock === 0;

  function handleAdd() {
    const result = addItem(product, quantity);
    if (!result.ok) {
      setError(result.error ?? "Could not add to cart.");
      setAdded(false);
      return;
    }
    setError(null);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleQuantityChange(value: string) {
    const parsed = Number(value);
    setQuantity(Number.isNaN(parsed) ? 0 : parsed);
    setError(null);
  }

  if (isUnavailable) {
    return (
      <button
        disabled
        className="mt-2 w-full cursor-not-allowed rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400"
      >
        Not Available
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={product.handInStock}
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
          aria-label="Quantity"
        />
        <button
          onClick={handleAdd}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition ${
            added ? "bg-emerald-600" : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          {added ? "Added ✓" : "Add to Cart"}
        </button>
      </div>
      {error && <p className="text-[11px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}
