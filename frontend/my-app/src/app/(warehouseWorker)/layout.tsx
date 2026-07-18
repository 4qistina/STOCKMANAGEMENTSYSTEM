import WarehouseNavbar from "@/src/app/components/WarehouseNavbar";

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WarehouseNavbar />
      {children}
    </>
  );
}
