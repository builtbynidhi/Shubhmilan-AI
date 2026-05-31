import { useState } from "react";

export interface ParsedDocumentFields {
  name: string | null;
  dateOfBirth: string | null;
  address: string | null;
  rawText: string;
}

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function processDocument(
    file: File
  ): Promise<ParsedDocumentFields | null> {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Lazy-load OCR — avoids bloating main bundle
      const { performOCR, parseAadhaarData } = await import("@/lib/ocr");

      setProgress(20);
      const ocrResult = await performOCR(file);
      setProgress(70);
      const parsed = parseAadhaarData(ocrResult.text);
      setProgress(100);

      return parsed;
    } catch {
      setError(
        "Couldn't read the document clearly. Please try a clearer photo or fill manually."
      );
      return null;
    } finally {
      setIsProcessing(false);
    }
  }

  return { processDocument, isProcessing, progress, error };
}
