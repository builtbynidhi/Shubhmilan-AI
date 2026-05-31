interface OCRResult {
  text: string;
  confidence: number;
}

interface ParsedDocument {
  name: string | null;
  dateOfBirth: string | null;
  address: string | null;
  rawText: string;
}

let tesseractWorker: unknown = null;

async function getWorker(): Promise<unknown> {
  if (tesseractWorker) return tesseractWorker;

  const Tesseract = await import("tesseract.js");
  tesseractWorker = await Tesseract.createWorker("eng+hin");
  return tesseractWorker;
}

export async function performOCR(
  imageSource: File | string
): Promise<OCRResult> {
  const worker = (await getWorker()) as {
    recognize: (source: File | string) => Promise<{
      data: { text: string; confidence: number };
    }>;
  };

  const result = await worker.recognize(imageSource);
  return {
    text: result.data.text,
    confidence: result.data.confidence,
  };
}

export function parseAadhaarData(rawText: string): ParsedDocument {
  const lines = rawText.split("\n").filter((line) => line.trim().length > 0);

  let name: string | null = null;
  let dateOfBirth: string | null = null;
  let address: string | null = null;

  // DOB pattern: DD/MM/YYYY or DD-MM-YYYY
  const dobPattern = /(\d{2}[/-]\d{2}[/-]\d{4})/;
  for (const line of lines) {
    const dobMatch = line.match(dobPattern);
    if (dobMatch) {
      dateOfBirth = dobMatch[1];
      break;
    }
  }

  // Name is typically after "Name" label or is the first meaningful line
  const namePattern = /(?:name|naam)\s*[:]\s*(.+)/i;
  for (const line of lines) {
    const nameMatch = line.match(namePattern);
    if (nameMatch) {
      name = nameMatch[1].trim();
      break;
    }
  }

  // If no labeled name found, use heuristic: first line with only alphabets
  if (!name) {
    for (const line of lines) {
      const cleanLine = line.trim();
      if (/^[A-Za-z\s]{3,40}$/.test(cleanLine) && !cleanLine.match(/government|india|aadhaar/i)) {
        name = cleanLine;
        break;
      }
    }
  }

  // Address: lines after "Address" label
  const addressIndex = lines.findIndex((line) =>
    /address|पता/i.test(line)
  );
  if (addressIndex >= 0) {
    const addressLines = lines.slice(addressIndex + 1, addressIndex + 4);
    address = addressLines.join(", ").trim();
  }

  return {
    name,
    dateOfBirth,
    address,
    rawText,
  };
}

export async function terminateOCR(): Promise<void> {
  if (tesseractWorker) {
    const worker = tesseractWorker as { terminate: () => Promise<void> };
    await worker.terminate();
    tesseractWorker = null;
  }
}
