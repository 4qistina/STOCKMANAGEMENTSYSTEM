import { CartProvider } from "@/src/app/contexts/CartContext";

// NOTE: Navbar is intentionally NOT rendered here anymore.
// It is only mounted on the Product List page (see products/page.tsx).
// Cart, Orders, Product Detail, and Update Stock pages render without it.
export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
