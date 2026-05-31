import type { BiodataFormData } from "@/types/biodata.types";

export async function generateBiodataPDF(
  formData: BiodataFormData,
  templateId: string,
): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");

  const { renderGenericToCanvasPages } = await import("./genericTemplateRenderer");
  const { TEMPLATE_THEMES } = await import("./templateThemes");

  const theme = TEMPLATE_THEMES[templateId];
  if (!theme) throw new Error(`Unknown template: ${templateId}`);

  const pages = await renderGenericToCanvasPages(formData, theme);
  const tplW = theme.width;
  const tplH = theme.height;

  // A4 dimensions in mm: 210 × 297
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  // Preserve the template's aspect ratio and center it on the A4 page.
  // jsPDF's addImage forces the bitmap into the given w×h box without keeping
  // aspect, so we letterbox/pillarbox instead of clamping (which distorts
  // non-A4-ratio templates like the 1080×1920 OK theme).
  const fit = Math.min(pageW / tplW, pageH / tplH);
  const drawW = tplW * fit;
  const drawH = tplH * fit;
  const ox = (pageW - drawW) / 2;
  const oy = (pageH - drawH) / 2;

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    const imgData = pages[i].toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", ox, oy, drawW, drawH);
  }

  return pdf.output("blob");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

