"use client";

// Brands are now managed from the combined Categories & Brands page
// (tabbed UI). This route is kept so old links/bookmarks still work — it
// just redirects straight to the Brands tab there.
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function RedirectToBrandsTab() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/warehouse/categories?tab=brand");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
      Redirecting…
    </div>
  );
}

export default function BrandsRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
          Redirecting…
        </div>
      }
    >
      <RedirectToBrandsTab />
    </Suspense>
  );
}
