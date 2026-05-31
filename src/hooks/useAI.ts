import { useState } from "react";
import { callGroq } from "@/lib/groq";
import type { AIRewriteFeature } from "@/lib/groq";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  async function rewriteField(
    feature: AIRewriteFeature,
    inputText: string
  ): Promise<string | null> {
    if (!inputText.trim()) {
      setError("Please enter some text first.");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await callGroq(feature, inputText);

      // Log usage (fire-and-forget, no await)
      if (user) {
        void apiFetch("/api/ai-usage", {
          method: "POST",
          body: { feature, inputText, outputText: result },
        }).catch(() => {});
      }

      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "AI rewrite failed. Please try again.";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    rewriteField,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
