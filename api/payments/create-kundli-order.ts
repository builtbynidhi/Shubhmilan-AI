/**
 * POST /api/payments/create-kundli-order
 * Creates a Razorpay order for kundli generation and a pending kundli_orders row.
 * Returns { orderId, amount (INR), currency, kundliOrderId }.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { db } from "../_lib/db";
import { kundliOrders } from "../_lib/schema";
import { KUNDLI_FEE_INR } from "../_lib/pricing";
import { createOrder } from "../_lib/razorpay";
import { handle, assertMethod, requireUser } from "../_lib/http";

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "POST");
  const userId = await requireUser(req);

  const { kundliId } = (req.body ?? {}) as { kundliId?: string };

  const [row] = await db
    .insert(kundliOrders)
    .values({
      userId,
      kundliId: kundliId ?? null,
      amountInr: KUNDLI_FEE_INR,
      status: "pending",
    })
    .returning();

  const orderId = await createOrder(KUNDLI_FEE_INR, row.id);

  await db
    .update(kundliOrders)
    .set({ razorpayOrderId: orderId, updatedAt: new Date() })
    .where(eq(kundliOrders.id, row.id));

  res.status(200).json({
    orderId,
    amount: KUNDLI_FEE_INR,
    currency: "INR",
    kundliOrderId: row.id,
  });
});
