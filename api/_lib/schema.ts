/**
 * Drizzle schema for ShubhMilan AI on Neon Postgres.
 *
 * Reconstructed from the column usage in the former Supabase code paths
 * (useBiodata/useKundli/useAuth/useAI + the payment + palm-rag functions).
 * NOTE: user ids come from Clerk (strings like "user_..."), so every user_id /
 * profiles.id is `text`, not uuid.
 */

import {
  pgTable,
  text,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  timestamp,
  uuid,
  vector,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), // Clerk user id
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  community: text("community").default("hindu"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const biodatas = pgTable("biodatas", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  title: text("title"),
  community: text("community"),
  templateId: text("template_id"),
  formData: jsonb("form_data").notNull(),
  aiEnhanced: boolean("ai_enhanced").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const kundlis = pgTable("kundlis", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  subjectName: text("subject_name"),
  birthDate: text("birth_date"),
  birthTime: text("birth_time"),
  birthPlace: text("birth_place"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  kundliData: jsonb("kundli_data"),
  aiExplanation: text("ai_explanation"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  feature: text("feature").notNull(),
  inputText: text("input_text"),
  outputText: text("output_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pdfOrders = pgTable("pdf_orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  biodataId: uuid("biodata_id"),
  templateId: text("template_id"),
  templatePriceInr: integer("template_price_inr"),
  baseFeeInr: integer("base_fee_inr"),
  totalAmountInr: integer("total_amount_inr").notNull(),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  status: text("status").notNull().default("pending"),
  pdfUrl: text("pdf_url"),
  pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true }),
  refundId: text("refund_id"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const kundliOrders = pgTable("kundli_orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  kundliId: uuid("kundli_id"),
  amountInr: integer("amount_inr").notNull(),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const astrologyKnowledge = pgTable(
  "astrology_knowledge",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    featureKey: text("feature_key").notNull(),
    qualifier: text("qualifier"),
    textEn: text("text_en").notNull(),
    textHi: text("text_hi").notNull(),
    source: text("source").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("astrology_knowledge_category_idx").on(table.category),
    index("astrology_knowledge_embedding_idx").using(
      "ivfflat",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

export const palmistryKnowledge = pgTable(
  "palmistry_knowledge",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    featureKey: text("feature_key").notNull(),
    qualifier: text("qualifier"),
    textEn: text("text_en").notNull(),
    textHi: text("text_hi").notNull(),
    source: text("source").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("palmistry_knowledge_category_idx").on(table.category),
    index("palmistry_knowledge_embedding_idx").using(
      "ivfflat",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
