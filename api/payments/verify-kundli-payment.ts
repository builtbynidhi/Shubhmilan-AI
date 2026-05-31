/**
 * POST /api/payments/verify-kundli-payment
 * Verifies the Razorpay signature and marks the kundli_orders row paid.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { db } from "../_lib/db";
import { kundliOrders } from "../_lib/schema";
import { verifySignature } from "../_lib/razorpay";
import { handle, assertMethod, requireUser, HttpError } from "../_lib/http";

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "POST");
  const userId = await requireUser(req);

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, kundliOrderId } =
    (req.body ?? {}) as {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      kundliOrderId?: string;
    };
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !kundliOrderId) {
    throw new HttpError(400, "Missing payment verification fields");
  }

  if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    await db
      .update(kundliOrders)
      .set({ status: "failed", updatedAt: new Date() })
      .where(and(eq(kundliOrders.id, kundliOrderId), eq(kundliOrders.userId, userId)));
    throw new HttpError(400, "Payment signature verification failed");
  }

  const [row] = await db
    .update(kundliOrders)
    .set({
      razorpayPaymentId,
      razorpaySignature,
      status: "paid",
      updatedAt: new Date(),
    })
    .where(and(eq(kundliOrders.id, kundliOrderId), eq(kundliOrders.userId, userId)))
    .returning();
  if (!row) throw new HttpError(404, "Order not found");

  res.status(200).json({ ok: true, status: row.status });
});
