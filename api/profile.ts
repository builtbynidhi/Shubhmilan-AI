/**
 * GET  /api/profile  — fetch the signed-in user's profile (auto-creates a row).
 * PUT  /api/profile  — update app fields (fullName, phone, community, avatarUrl).
 * Returns the camelCase UserProfile shape the app expects.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { db } from "./_lib/db";
import { profiles } from "./_lib/schema";
import { handle, assertMethod, requireUser } from "./_lib/http";

type ProfileRow = typeof profiles.$inferSelect;

function toUserProfile(row: ProfileRow) {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email ?? "",
    phone: row.phone,
    community: row.community ?? "hindu",
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "GET", "PUT");
  const userId = await requireUser(req);

  if (req.method === "GET") {
    const [row] = await db.select().from(profiles).where(eq(profiles.id, userId));
    if (row) {
      res.status(200).json(toUserProfile(row));
      return;
    }
    // Auto-create an empty profile on first access.
    const [created] = await db
      .insert(profiles)
      .values({ id: userId, community: "hindu" })
      .onConflictDoNothing()
      .returning();
    const [ensured] =
      created != null
        ? [created]
        : await db.select().from(profiles).where(eq(profiles.id, userId));
    res.status(200).json(toUserProfile(ensured));
    return;
  }

  // PUT — upsert app-editable fields.
  const body = (req.body ?? {}) as {
    fullName?: string;
    phone?: string;
    community?: string;
    avatarUrl?: string;
    email?: string;
  };
  const [row] = await db
    .insert(profiles)
    .values({
      id: userId,
      fullName: body.fullName,
      phone: body.phone,
      community: body.community ?? "hindu",
      avatarUrl: body.avatarUrl,
      email: body.email,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        fullName: body.fullName,
        phone: body.phone,
        community: body.community,
        avatarUrl: body.avatarUrl,
        email: body.email,
        updatedAt: new Date(),
      },
    })
    .returning();
  res.status(200).json(toUserProfile(row));
});
