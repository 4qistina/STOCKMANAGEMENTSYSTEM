"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  userId: number;
  userFullname: string;
  username: string;
  role: string;
}

/**
 * Reads the logged-in user from local storage and redirects to /login if
 * there isn't one, or if their role doesn't match `requiredRole`.
 *
 * Every protected page previously duplicated this exact check; centralising
 * it here means role names and storage keys only need to change in one place.
 */
export function useAuthGuard(requiredRole: "supervisor" | "warehouse_staff"): AuthUser | null {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.replace("/login");
      return;
    }

    try {
      const parsed: AuthUser = JSON.parse(stored);
      if (parsed.role !== requiredRole) {
        router.replace("/login");
        return;
      }
      setUser(parsed);
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
      router.replace("/login");
    }
    // Only needs to run once on mount; requiredRole is fixed per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return user;
}
