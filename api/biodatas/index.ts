/**
 * GET  /api/biodatas — list the signed-in user's biodatas (newest first).
 * POST /api/biodatas — insert (no id) or update (with id) a biodata.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../_lib/db";
import { biodatas } from "../_lib/schema";
import { toBiodata } from "../_lib/serializers";
import { handle, assertMethod, requireUser, HttpError } from "../_lib/http";

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "GET", "POST");
  const userId = await requireUser(req);

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(biodatas)
      .where(eq(biodatas.userId, userId))
      .orderBy(desc(biodatas.updatedAt));
    res.status(200).json(rows.map(toBiodata));
    return;
  }

  // POST — upsert.
  const p = (req.body ?? {}) as {
    id?: string;
    title?: string;
    community?: string;
    templateId?: string;
    formData?: unknown;
    aiEnhanced?: boolean;
  };

  if (p.id) {
    const [row] = await db
      .update(biodatas)
      .set({
        title: p.title,
        community: p.community,
        templateId: p.templateId,
        formData: p.formData,
        aiEnhanced: p.aiEnhanced,
        updatedAt: new Date(),
      })
      .where(and(eq(biodatas.id, p.id), eq(biodatas.userId, userId)))
      .returning();
    if (!row) throw new HttpError(404, "Biodata not found");
    res.status(200).json(toBiodata(row));
    return;
  }

  if (p.formData == null) throw new HttpError(400, "formData is required");
  const [row] = await db
    .insert(biodatas)
    .values({
      userId,
      title: p.title,
      community: p.community,
      templateId: p.templateId,
      formData: p.formData,
      aiEnhanced: p.aiEnhanced ?? false,
    })
    .returning();
  res.status(201).json(toBiodata(row));
});
