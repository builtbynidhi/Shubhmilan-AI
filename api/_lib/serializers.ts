/** Row → app-shape (camelCase) mappers, mirroring the former Supabase hooks. */

import type { biodatas, kundlis } from "./schema";

type BiodataRow = typeof biodatas.$inferSelect;
type KundliRow = typeof kundlis.$inferSelect;

export function toBiodata(row: BiodataRow) {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    community: row.community,
    templateId: row.templateId,
    formData: row.formData,
    aiEnhanced: row.aiEnhanced,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toKundli(row: KundliRow) {
  return {
    id: row.id,
    userId: row.userId,
    subjectName: row.subjectName,
    birthDate: row.birthDate,
    birthTime: row.birthTime,
    birthPlace: row.birthPlace,
    latitude: row.latitude,
    longitude: row.longitude,
    kundliData: row.kundliData,
    aiExplanation: row.aiExplanation,
    pdfUrl: row.pdfUrl,
    createdAt: row.createdAt,
  };
}
