CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"feature" text NOT NULL,
	"input_text" text,
	"output_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biodatas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"community" text,
	"template_id" text,
	"form_data" jsonb NOT NULL,
	"ai_enhanced" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kundli_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kundli_id" uuid,
	"amount_inr" integer NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kundlis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subject_name" text,
	"birth_date" text,
	"birth_time" text,
	"birth_place" text,
	"latitude" double precision,
	"longitude" double precision,
	"kundli_data" jsonb,
	"ai_explanation" text,
	"pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "palmistry_knowledge" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"feature_key" text NOT NULL,
	"qualifier" text,
	"text_en" text NOT NULL,
	"text_hi" text NOT NULL,
	"source" text NOT NULL,
	"embedding" vector(1536),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdf_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"biodata_id" uuid,
	"template_id" text,
	"template_price_inr" integer,
	"base_fee_inr" integer,
	"total_amount_inr" integer NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"pdf_url" text,
	"pdf_generated_at" timestamp with time zone,
	"refund_id" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text,
	"email" text,
	"phone" text,
	"community" text DEFAULT 'hindu',
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "palmistry_knowledge_category_idx" ON "palmistry_knowledge" USING btree ("category");--> statement-breakpoint
CREATE INDEX "palmistry_knowledge_embedding_idx" ON "palmistry_knowledge" USING ivfflat ("embedding" vector_cosine_ops);