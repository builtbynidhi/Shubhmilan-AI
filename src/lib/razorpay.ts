import type { RazorpaySuccessResponse } from "@/types/payment.types";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  image?: string;
  theme?: { color: string };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

let razorpayLoaded = false;

export async function loadRazorpaySDK(): Promise<void> {
  if (razorpayLoaded && window.Razorpay) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (!window.Razorpay) {
        reject(new Error("Payment system unavailable. Please disable any ad blocker and try again."));
        return;
      }
      razorpayLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error("Failed to load Razorpay SDK"));
    };
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: {
  orderId: string;
  amount: number;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
}): Promise<void> {
  await loadRazorpaySDK();

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string;
  if (!razorpayKeyId) {
    throw new Error("Razorpay Key ID not configured. Set VITE_RAZORPAY_KEY_ID in .env");
  }

  if (!window.Razorpay) {
    throw new Error("Payment system unavailable. Please disable any ad blocker and try again.");
  }

  const rzp = new window.Razorpay({
    key: razorpayKeyId,
    amount: options.amount * 100, // Convert to paise
    currency: "INR",
    order_id: options.orderId,
    name: "ShubhMilan.ai",
    description: options.description,
    image: "https://shubhmilan.ai/logo.png",
    theme: { color: "#E8A838" },
    prefill: options.prefill,
    handler: options.onSuccess,
    modal: {
      ondismiss: options.onDismiss,
    },
  });

  rzp.open();
}
