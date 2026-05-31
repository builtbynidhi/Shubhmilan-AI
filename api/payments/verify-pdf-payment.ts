/**
 * POST /api/payments/verify-pdf-payment
 * Verifies the Razorpay signature and marks the pdf_orders row paid.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { db } from "../_lib/db";
import { pdfOrders } from "../_lib/schema";
import { verifySignature } from "../_lib/razorpay";
import { handle, assertMethod, requireUser, HttpError } from "../_lib/http";

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "POST");
  const userId = await requireUser(req);

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, pdfOrderId } =
    (req.body ?? {}) as {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      pdfOrderId?: string;
    };
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !pdfOrderId) {
    throw new HttpError(400, "Missing payment verification fields");
  }

  if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    await db
      .update(pdfOrders)
      .set({ status: "failed", failureReason: "Signature mismatch", updatedAt: new Date() })
      .where(and(eq(pdfOrders.id, pdfOrderId), eq(pdfOrders.userId, userId)));
    throw new HttpError(400, "Payment signature verification failed");
  }

  const [row] = await db
    .update(pdfOrders)
    .set({
      razorpayPaymentId,
      razorpaySignature,
      status: "paid",
      updatedAt: new Date(),
    })
    .where(and(eq(pdfOrders.id, pdfOrderId), eq(pdfOrders.userId, userId)))
    .returning();
  if (!row) throw new HttpError(404, "Order not found");

  res.status(200).json({ ok: true, status: row.status });
});
