import { create } from "zustand";
import type { UserProfile } from "@/types/user.types";

/** Minimal identity surface the app uses (mapped from the Clerk user). */
export interface AppUser {
  id: string;
  email: string;
  /** Full name from Clerk (Google/profile), if the user has one. */
  name?: string | null;
}

interface AuthStore {
  // Identity (from Clerk)
  user: AppUser | null;
  // Profile row from our `profiles` table (via /api/profile)
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AppUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  clear: () =>
    set({ user: null, profile: null, isAuthenticated: false, isLoading: false }),
}));
