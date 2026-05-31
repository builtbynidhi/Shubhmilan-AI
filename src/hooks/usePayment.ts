import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useAuthStore } from "@/store/authStore";
import type { RazorpaySuccessResponse } from "@/types/payment.types";

interface CreatePdfOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  pdfOrderId: string;
}

interface CreateKundliOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  kundliOrderId: string;
}

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuthStore();

  async function initiatePDFPayment(
    biodataId: string,
    templateId: string,
    onSuccess: (pdfOrderId: string) => void,
    onDismiss?: () => void
  ): Promise<void> {
    if (!user) {
      setError("Please sign in to continue.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create Razorpay order via backend
      const data = await apiFetch<CreatePdfOrderResponse>(
        "/api/payments/create-pdf-order",
        { method: "POST", body: { biodataId, templateId } }
      );

      // 2. Open Razorpay checkout
      await openRazorpayCheckout({
        orderId: data.orderId,
        amount: data.amount,
        description: "Biodata PDF Download",
        prefill: {
          name: profile?.fullName ?? undefined,
          email: user.email ?? undefined,
          contact: profile?.phone ?? undefined,
        },
        onSuccess: async (response: RazorpaySuccessResponse) => {
          // 3. Verify payment via backend. This handler runs after
          // openRazorpayCheckout has resolved, so the outer try/catch is no
          // longer active — handle verification failures here directly.
          try {
            await apiFetch("/api/payments/verify-pdf-payment", {
              method: "POST",
              body: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                pdfOrderId: data.pdfOrderId,
              },
            });
            onSuccess(data.pdfOrderId);
          } catch (err) {
            setError(
              err instanceof Error
                ? `Payment ho gaya but verify nahi ho paya: ${err.message}. Thodi der mein dobara try karein ya support se sampark karein.`
                : "Payment ho gaya but verify nahi ho paya. Thodi der mein dobara try karein ya support se sampark karein."
            );
          }
        },
        onDismiss,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function initiateKundliPayment(
    kundliId: string,
    onSuccess: (kundliOrderId: string) => void,
    onDismiss?: () => void
  ): Promise<void> {
    if (!user) {
      setError("Please sign in to continue.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create Razorpay order via backend
      const data = await apiFetch<CreateKundliOrderResponse>(
        "/api/payments/create-kundli-order",
        { method: "POST", body: { kundliId } }
      );

      // 2. Open Razorpay checkout
      await openRazorpayCheckout({
        orderId: data.orderId,
        amount: data.amount,
        description: "Kundli Generation",
        prefill: {
          name: profile?.fullName ?? undefined,
          email: user.email ?? undefined,
          contact: profile?.phone ?? undefined,
        },
        onSuccess: async (response: RazorpaySuccessResponse) => {
          // 3. Verify payment via backend. This handler runs after
          // openRazorpayCheckout has resolved, so the outer try/catch is no
          // longer active — handle verification failures here directly.
          try {
            await apiFetch("/api/payments/verify-kundli-payment", {
              method: "POST",
              body: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                kundliOrderId: data.kundliOrderId,
              },
            });
            onSuccess(data.kundliOrderId);
          } catch (err) {
            setError(
              err instanceof Error
                ? `Payment ho gaya but verify nahi ho paya: ${err.message}. Thodi der mein dobara try karein ya support se sampark karein.`
                : "Payment ho gaya but verify nahi ho paya. Thodi der mein dobara try karein ya support se sampark karein."
            );
          }
        },
        onDismiss,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    initiatePDFPayment,
    initiateKundliPayment,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}
