/**
 * GET  /api/kundlis — list the signed-in user's kundlis (newest first).
 * POST /api/kundlis — create a kundli from birth details (+ optional chart data).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { desc, eq } from "drizzle-orm";
import { db } from "../_lib/db";
import { kundlis } from "../_lib/schema";
import { toKundli } from "../_lib/serializers";
import { handle, assertMethod, requireUser } from "../_lib/http";

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "GET", "POST");
  const userId = await requireUser(req);

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(kundlis)
      .where(eq(kundlis.userId, userId))
      .orderBy(desc(kundlis.createdAt));
    res.status(200).json(rows.map(toKundli));
    return;
  }

  // POST — mirrors the former insert (birth details), accepting optional
  // generated chart data + explanation when the client has them.
  const p = (req.body ?? {}) as {
    subject_name?: string;
    birth_date?: string;
    birth_time?: string;
    birth_place?: string;
    latitude?: number;
    longitude?: number;
    kundli_data?: unknown;
    ai_explanation?: string;
  };
  const [row] = await db
    .insert(kundlis)
    .values({
      userId,
      subjectName: p.subject_name,
      birthDate: p.birth_date,
      birthTime: p.birth_time,
      birthPlace: p.birth_place,
      latitude: p.latitude,
      longitude: p.longitude,
      kundliData: p.kundli_data,
      aiExplanation: p.ai_explanation,
    })
    .returning();
  res.status(201).json(toKundli(row));
});
