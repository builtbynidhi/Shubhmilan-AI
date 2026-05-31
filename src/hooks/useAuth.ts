/**
 * Auth layer. When Clerk is configured (VITE_CLERK_PUBLISHABLE_KEY set), the
 * ClerkAuthBridge syncs the Clerk session into the Zustand store and registers
 * the apiFetch token getter + signOut. When it's NOT configured, the app runs
 * in auth-disabled mode (public features still work) via NoAuthBridge.
 *
 * `useAuth()` itself reads only the store, so pages work in both modes.
 */

import { useEffect } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useAuthStore } from "@/store/authStore";
import { apiFetch, setTokenGetter } from "@/lib/api";
import type { UserProfile } from "@/types/user.types";

export const CLERK_ENABLED = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined);

// Module-level ref so the read-only useAuth() can trigger Clerk signOut.
let clerkSignOut: (() => Promise<unknown>) | null = null;

/** Mounted once (only when Clerk is configured) to mirror Clerk → store. */
export function ClerkAuthBridge() {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { setUser, setProfile, setLoading, clear } = useAuthStore();

  useEffect(() => {
    setTokenGetter(() => getToken());
    clerkSignOut = () => signOut();
    return () => {
      setTokenGetter(null);
      clerkSignOut = null;
    };
  }, [getToken, signOut]);

  useEffect(() => {
    if (!isLoaded) {
      setLoading(true);
      return;
    }
    if (isSignedIn && clerkUser) {
      setUser({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
      });
      apiFetch<UserProfile>("/api/profile")
        .then(setProfile)
        .catch(() => setProfile(null))
        .finally(() => setLoading(false));
    } else {
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, clerkUser?.id]);

  return null;
}

/** Used when Clerk isn't configured — just unblock the loading state. */
export function NoAuthBridge() {
  const setLoading = useAuthStore((s) => s.setLoading);
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);
  return null;
}

/** Read-only auth surface for pages (no Clerk hooks → safe everywhere). */
export function useAuth() {
  const { user, profile, isLoading } = useAuthStore();
  return {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading,
    signOut: async () => {
      if (clerkSignOut) await clerkSignOut();
      else useAuthStore.getState().clear();
    },
  };
}
