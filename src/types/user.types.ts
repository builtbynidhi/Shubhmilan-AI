import type { Community } from "./biodata.types";

// Matches the `profiles` Supabase table (snake_case from DB)
export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  community: Community;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Camel-case version used in app UI
export interface UserProfile {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  community: Community;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function profileToUserProfile(p: Profile): UserProfile {
  return {
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    phone: p.phone,
    community: p.community,
    avatarUrl: p.avatar_url,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}
