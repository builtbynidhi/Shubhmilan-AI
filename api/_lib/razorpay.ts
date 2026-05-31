/** Razorpay server helpers — order creation + signature verification. */

import Razorpay from "razorpay";
import { createHmac } from "node:crypto";
import { HttpError } from "./http";

export function getRazorpay(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new HttpError(500, "Razorpay keys not configured");
  }
  return new Razorpay({ key_id, key_secret });
}

/** Create a Razorpay order. `amountInr` is in rupees; Razorpay needs paise. */
export async function createOrder(amountInr: number, receipt: string): Promise<string> {
  const order = await getRazorpay().orders.create({
    amount: amountInr * 100,
    currency: "INR",
    receipt,
  });
  return order.id;
}

/** Verify the Razorpay payment signature (HMAC-SHA256 of "orderId|paymentId"). */
export function verifySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new HttpError(500, "Razorpay secret not configured");
  const expected = createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return expected === razorpaySignature;
}
