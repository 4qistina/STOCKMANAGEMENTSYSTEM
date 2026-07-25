"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartItem {
  productID: number;
  productCode?: string;
  productModel?: string;
  productPrice: number;
  productImage?: string;
  handInStock: number;
  // Warehouse quantity: how many units the warehouse has on hand. This is
  // the ceiling on how much of this product can be ordered — separate from
  // "handInStock", which is just the Supervisor's own retail count.
  productQuantity: number;
  productStatus?: string;
  quantity: number;
}

interface AddItemResult {
  ok: boolean;
  error?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Omit<CartItem, "quantity">, quantity: number) => AddItemResult;
  updateQuantity: (productID: number, quantity: number) => void;
  removeItem: (productID: number) => void;
  clearCart: () => void;
  totalCount: number;
  distinctCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist cart whenever it changes
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  function addItem(product: Omit<CartItem, "quantity">, quantity: number): AddItemResult {
    // E1: Product Not Available
    if (product.productStatus === "Not Available") {
      return { ok: false, error: "This product is not available." };
    }

    // E2: quantity must be greater than 0
    if (!quantity || quantity <= 0) {
      return { ok: false, error: "Please enter a value greater than 0" };
    }

    // An order draws from the WAREHOUSE's productQuantity, so the cart can
    // never hold more of an item than the warehouse actually has on hand.
    // (This is intentionally NOT capped by handInStock — a retail location
    // being low/out of stock is exactly why a Supervisor would order more.)
    const warehouseQty = product.productQuantity ?? 0;
    const existingQty = items.find((i) => i.productID === product.productID)?.quantity ?? 0;
    if (existingQty + quantity > warehouseQty) {
      const remaining = Math.max(0, warehouseQty - existingQty);
      return {
        ok: false,
        error:
          remaining > 0
            ? `Only ${remaining} more unit(s) available from the warehouse.`
            : `No more units available from the warehouse (${warehouseQty} already in your cart).`,
      };
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.productID === product.productID);
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        return prev.map((i) =>
          i.productID === product.productID ? { ...i, quantity: newQuantity } : i
        );
      }
      return [...prev, { ...product, quantity }];
    });

    return { ok: true };
  }

  function updateQuantity(productID: number, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productID === productID
            ? { ...i, quantity: Math.min(quantity, i.productQuantity ?? quantity) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(productID: number) {
    setItems((prev) => prev.filter((i) => i.productID !== productID));
  }

  function clearCart() {
    setItems([]);
  }

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  // Number of distinct products in the cart (e.g. MacBook qty 3 + iPad qty 2 = 2 items),
  // used for the navbar badge so it doesn't read as a total-units count.
  const distinctCount = items.length;
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.productPrice, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, totalCount, distinctCount, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
