/**
 * POST /api/payments/create-pdf-order
 * Creates a Razorpay order for a biodata PDF and a pending pdf_orders row.
 * Returns { orderId, amount (INR), currency, pdfOrderId }.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { db } from "../_lib/db";
import { pdfOrders } from "../_lib/schema";
import { pdfPricing } from "../_lib/pricing";
import { createOrder } from "../_lib/razorpay";
import { handle, assertMethod, requireUser, HttpError } from "../_lib/http";

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "POST");
  const userId = await requireUser(req);

  const { biodataId, templateId } = (req.body ?? {}) as {
    biodataId?: string;
    templateId?: string;
  };
  if (!templateId) throw new HttpError(400, "templateId is required");

  const { templatePriceInr, baseFeeInr, totalInr } = pdfPricing(templateId);

  const [row] = await db
    .insert(pdfOrders)
    .values({
      userId,
      biodataId: biodataId ?? null,
      templateId,
      templatePriceInr,
      baseFeeInr,
      totalAmountInr: totalInr,
      status: "pending",
    })
    .returning();

  const orderId = await createOrder(totalInr, row.id);

  await db
    .update(pdfOrders)
    .set({ razorpayOrderId: orderId, updatedAt: new Date() })
    .where(eq(pdfOrders.id, row.id));

  res.status(200).json({
    orderId,
    amount: totalInr,
    currency: "INR",
    pdfOrderId: row.id,
  });
});
