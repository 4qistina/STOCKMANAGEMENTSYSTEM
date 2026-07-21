"use client";

export const PAGE_SIZE = 12;

export function paginate<T>(items: T[], page: number, pageSize: number = PAGE_SIZE): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export default function Pagination({
  page,
  totalItems,
  pageSize = PAGE_SIZE,
  onChange,
}: {
  page: number;
  totalItems: number;
  pageSize?: number;
  onChange: (next: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  // Compact page-number list: always show first, last, current, and one
  // neighbour on each side; collapse the rest into an ellipsis.
  const pageNumbers: (number | "ellipsis")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pageNumbers.push(p);
    } else if (pageNumbers[pageNumbers.length - 1] !== "ellipsis") {
      pageNumbers.push("ellipsis");
    }
  }

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row">
      <p className="text-[12px] text-slate-400">
        Showing <span className="font-semibold text-slate-600">{start}</span>–
        <span className="font-semibold text-slate-600">{end}</span> of{" "}
        <span className="font-semibold text-slate-600">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        {pageNumbers.map((p, idx) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="px-1.5 text-[12px] text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 font-mono text-[12px] font-bold transition ${
                p === page
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:text-sky-700"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
