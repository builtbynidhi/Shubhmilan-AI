/**
 * POST /api/ai-usage — fire-and-forget logging of AI rewrite usage.
 * The Groq call itself stays client-side; this only records the usage row.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./_lib/db";
import { aiUsageLogs } from "./_lib/schema";
import { handle, assertMethod, requireUser } from "./_lib/http";

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "POST");
  const userId = await requireUser(req);

  const { feature, inputText, outputText } = (req.body ?? {}) as {
    feature?: string;
    inputText?: string;
    outputText?: string;
  };
  if (!feature) {
    res.status(400).json({ error: "feature is required" });
    return;
  }

  await db.insert(aiUsageLogs).values({ userId, feature, inputText, outputText });
  res.status(201).json({ ok: true });
});
