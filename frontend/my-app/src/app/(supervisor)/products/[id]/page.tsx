"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AddToCartControl from "@/src/app/components/AddToCartControl";
import { formatCurrency } from "@/src/lib/format";
import { useAuthGuard } from "@/src/lib/useAuthGuard";

interface Product {
  productID?: number;
  productCode?: string;
  productModel?: string;
  productPrice?: number;
  handInStock?: number;
  productImage?: string;
  productStatus?: string;
  categoryName?: string;
  brandName?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;

  const user = useAuthGuard("supervisor");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // --- Fetch Product Detail ---
  useEffect(() => {
    if (!user || !productId) return;

    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`${API_BASE}/api/products/${productId}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load product");
        const data = await res.json();
        if (!cancelled) setProduct(data);
      } catch (err) {
        console.error("Failed to fetch product detail:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [user, productId]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] text-slate-400">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#f4f8fb_0%,#e9f1f7_55%,#dfebf3_100%)] px-5 py-8 sm:px-8 font-sans text-slate-700">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb / Back */}
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400 transition hover:text-sky-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="h-3 w-3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Product Directory
        </Link>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)] sm:grid-cols-2 sm:p-8">
            <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
            <div className="flex flex-col gap-3">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-7 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-6 h-10 w-full animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        ) : notFound || !product ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
            <h3 className="font-[Barlow_Condensed,sans-serif] text-lg font-bold uppercase text-slate-700">
              Product not found
            </h3>
            <p className="mt-1 text-[13px] text-slate-400">
              This item may have been removed or is no longer listed.
            </p>
            <Link
              href="/products"
              className="mt-4 rounded-lg bg-sky-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-800 transition hover:bg-sky-200"
            >
              Back to Product Directory
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_20px_40px_-30px_rgba(51,65,60,0.15)] sm:p-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {/* Image */}
              <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                {product.productImage ? (
                  <img
                    src={product.productImage}
                    alt={product.productModel ?? "Product Image"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1"
                    stroke="currentColor"
                    className="h-16 w-16 text-slate-300"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                )}

                {product.productStatus === "Not Available" && (
                  <span className="absolute left-3 top-3 rounded-md bg-slate-600 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                    Not Available
                  </span>
                )}
                {product.handInStock === 0 && product.productStatus !== "Not Available" && (
                  <span className="absolute left-3 top-3 rounded-md bg-rose-600 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-400">
                  {product.categoryName && (
                    <>
                      <span className="uppercase tracking-wide text-slate-500">{product.categoryName}</span>
                      <span>•</span>
                    </>
                  )}
                  <span className="uppercase font-semibold text-sky-600">{product.brandName ?? "Generic"}</span>
                  <span>•</span>
                  <span>{product.productCode ?? "N/A"}</span>
                </div>

                <h1 className="mt-2 font-[Barlow_Condensed,sans-serif] text-3xl font-bold uppercase leading-tight text-slate-800">
                  {product.productModel ?? "Unnamed Product"}
                </h1>

                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {formatCurrency(product.productPrice)}
                </p>

                <div className="mt-3 flex items-center gap-2 text-[13px]">
                  <span className="text-slate-400">Availability:</span>
                  {product.productStatus === "Not Available" ? (
                    <span className="font-semibold text-slate-600">Not Available</span>
                  ) : (product.handInStock ?? 0) === 0 ? (
                    <span className="font-semibold text-rose-600">Out of Stock</span>
                  ) : (
                    <span className="font-semibold text-emerald-600">
                      {product.handInStock} unit{product.handInStock === 1 ? "" : "s"} in stock
                    </span>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-6">
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
                    Add to Cart
                  </p>
                  {/* Enforces E1 (unavailable) and E2 (invalid quantity) */}
                  <AddToCartControl
                    product={{
                      productID: product.productID ?? 0,
                      productCode: product.productCode,
                      productModel: product.productModel,
                      productPrice: Number(product.productPrice ?? 0),
                      productImage: product.productImage,
                      handInStock: product.handInStock ?? 0,
                      productStatus: product.productStatus,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
