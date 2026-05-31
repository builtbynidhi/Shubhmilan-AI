/**
 * GET    /api/kundlis/:id — fetch one kundli (owner-scoped).
 * DELETE /api/kundlis/:id — delete one kundli (owner-scoped).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { db } from "../_lib/db";
import { kundlis } from "../_lib/schema";
import { toKundli } from "../_lib/serializers";
import { handle, assertMethod, requireUser, HttpError } from "../_lib/http";

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "GET", "DELETE");
  const userId = await requireUser(req);
  const id = String(req.query.id);

  if (req.method === "GET") {
    const [row] = await db
      .select()
      .from(kundlis)
      .where(and(eq(kundlis.id, id), eq(kundlis.userId, userId)));
    if (!row) throw new HttpError(404, "Kundli not found");
    res.status(200).json(toKundli(row));
    return;
  }

  await db
    .delete(kundlis)
    .where(and(eq(kundlis.id, id), eq(kundlis.userId, userId)));
  res.status(204).end();
});
