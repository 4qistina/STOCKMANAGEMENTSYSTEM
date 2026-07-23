"use client";

import { useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Mount once in the root layout. Patches window.fetch so every request to
 * the backend API carries an "x-role" header with the logged-in user's
 * role, read from the same localStorage "user" object useAuthGuard reads.
 *
 * This exists so backend/middleware/roleCheck.js has a role to check,
 * without editing every page's individual fetch() calls.
 */
export default function ApiRoleHeader() {
  useEffect(() => {
    // Guard against re-patching (e.g. React Strict Mode double-invoking
    // effects in dev, or hot reload re-mounting this component).
    if ((window.fetch as any).__roleHeaderPatched) return;

    const originalFetch = window.fetch.bind(window);

    const patched: typeof window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;

      if (API_BASE && url.startsWith(API_BASE)) {
        let role: string | undefined;
        try {
          const stored = localStorage.getItem("user");
          role = stored ? JSON.parse(stored).role : undefined;
        } catch {
          role = undefined;
        }

        if (role) {
          const headers = new Headers(init?.headers ?? (input as Request).headers);
          headers.set("x-role", role);
          return originalFetch(input, { ...init, headers });
        }
      }

      return originalFetch(input, init);
    };

    (patched as any).__roleHeaderPatched = true;
    window.fetch = patched;
  }, []);

  return null;
}