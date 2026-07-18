"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartItem {
  productID: number;
  productCode?: string;
  productModel?: string;
  productPrice: number;
  productImage?: string;
  handInStock: number;
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

    if (quantity > product.handInStock) {
      return { ok: false, error: `Only ${product.handInStock} left in stock.` };
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.productID === product.productID);
      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantity, product.handInStock);
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
        .map((i) => (i.productID === productID ? { ...i, quantity } : i))
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
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.productPrice, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, totalCount, totalPrice }}
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
