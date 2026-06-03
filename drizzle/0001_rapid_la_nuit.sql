CREATE TABLE "astrology_knowledge" (
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
CREATE INDEX "astrology_knowledge_category_idx" ON "astrology_knowledge" USING btree ("category");--> statement-breakpoint
CREATE INDEX "astrology_knowledge_embedding_idx" ON "astrology_knowledge" USING ivfflat ("embedding" vector_cosine_ops);