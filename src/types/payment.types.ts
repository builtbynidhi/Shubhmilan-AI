export type PaymentStatus =
  | "pending"
  | "paid"
  | "generating"
  | "ready"
  | "failed"
  | "refunded";

export interface PdfOrder {
  id: string;
  userId: string;
  biodataId: string;
  templateId: string;
  templatePriceInr: number;
  baseFeeInr: number;
  totalAmountInr: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  status: PaymentStatus;
  pdfUrl: string | null;
  pdfGeneratedAt: string | null;
  refundId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KundliOrder {
  id: string;
  userId: string;
  kundliId: string;
  amountInr: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  status: PaymentStatus;
  refundId: string | null;
  createdAt: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  orderId: string;
}

export interface PriceBreakdown {
  baseFee: number;
  templateFee: number;
  total: number;
  templateName: string;
  templateTier: string;
}
