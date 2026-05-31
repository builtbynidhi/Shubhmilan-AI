/**
 * GET    /api/biodatas/:id — fetch one biodata (owner-scoped).
 * DELETE /api/biodatas/:id — delete one biodata (owner-scoped).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { db } from "../_lib/db";
import { biodatas } from "../_lib/schema";
import { toBiodata } from "../_lib/serializers";
import { handle, assertMethod, requireUser, HttpError } from "../_lib/http";

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "GET", "DELETE");
  const userId = await requireUser(req);
  const id = String(req.query.id);

  if (req.method === "GET") {
    const [row] = await db
      .select()
      .from(biodatas)
      .where(and(eq(biodatas.id, id), eq(biodatas.userId, userId)));
    if (!row) throw new HttpError(404, "Biodata not found");
    res.status(200).json(toBiodata(row));
    return;
  }

  await db
    .delete(biodatas)
    .where(and(eq(biodatas.id, id), eq(biodatas.userId, userId)));
  res.status(204).end();
});
