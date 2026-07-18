import { CartProvider } from "@/src/app/contexts/CartContext";
import Navbar from "@/src/app/components/Navbar";

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Navbar />
      {children}
    </CartProvider>
  );
}
