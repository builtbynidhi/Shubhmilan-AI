import type { AppUser } from "@/store/authStore";
import type { UserProfile } from "@/types/user.types";

/** Turn an email local-part into a Title-Cased guess: nidhikumari.prof → Nidhikumari Prof. */
function nameFromEmail(email?: string | null): string {
  if (!email) return "";
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Best available human display name, in priority order:
 *   our profile name → Clerk name → prettified email → "Account".
 * Used by the navbar and dashboard so a signed-in user never sees a raw email.
 */
export function displayName(
  user?: AppUser | null,
  profile?: UserProfile | null
): string {
  return (
    profile?.fullName?.trim() ||
    user?.name?.trim() ||
    nameFromEmail(user?.email) ||
    "Account"
  );
}
