CREATE TYPE "public"."tag_source" AS ENUM('onboarding', 'discord', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."tag_type" AS ENUM('user_experience', 'user_interest', 'user_special', 'content');--> statement-breakpoint
CREATE TABLE "hack_prerequisites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hack_id" uuid NOT NULL,
	"prerequisite_hack_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "hack_prerequisites_hack_id_prerequisite_hack_id_key" UNIQUE("hack_id","prerequisite_hack_id"),
	CONSTRAINT "no_self_prerequisite" CHECK (hack_id <> prerequisite_hack_id)
);
--> statement-breakpoint
ALTER TABLE "hack_prerequisites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hack_tags" (
	"hack_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"assigned_by" uuid,
	CONSTRAINT "hack_tags_pkey" PRIMARY KEY("hack_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "hack_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"content_type" text NOT NULL,
	"content_body" text,
	"external_link" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"image_path" text,
	CONSTRAINT "hacks_content_type_check" CHECK (content_type = ANY (ARRAY['content'::text, 'link'::text])),
	CONSTRAINT "content_xor_link" CHECK (((content_type = 'content'::text) AND (content_body IS NOT NULL) AND (external_link IS NULL)) OR ((content_type = 'link'::text) AND (external_link IS NOT NULL) AND (content_body IS NULL))),
	CONSTRAINT "hacks_image_check" CHECK ((image_url IS NOT NULL) OR (image_path IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "hacks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "onboarding_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"question_id" text NOT NULL,
	"answer" jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"skipped" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "onboarding_responses_user_id_question_id_key" UNIQUE("user_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "onboarding_responses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"is_admin" boolean DEFAULT false,
	"discord_id" text,
	"discord_username" text,
	"discord_roles" text[] DEFAULT '{""}',
	CONSTRAINT "profiles_email_key" UNIQUE("email"),
	CONSTRAINT "profiles_discord_id_key" UNIQUE("discord_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" text NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	CONSTRAINT "question_options_question_id_value_key" UNIQUE("question_id","value")
);
--> statement-breakpoint
ALTER TABLE "question_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
	CONSTRAINT "questions_type_check" CHECK (type = ANY (ARRAY['single'::text, 'multiple'::text])),
	CONSTRAINT "questions_category_check" CHECK (category = ANY (ARRAY['experience'::text, 'interests'::text, 'goals'::text, 'time'::text, 'difficulty'::text]))
);
--> statement-breakpoint
ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tag_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"tag_id" uuid,
	"action" text,
	"source" "tag_source" NOT NULL,
	"target" text,
	"previous_value" jsonb,
	"new_value" jsonb,
	"conflict_details" jsonb,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "tag_sync_log_action_check" CHECK (action = ANY (ARRAY['added'::text, 'removed'::text, 'conflict_resolved'::text])),
	CONSTRAINT "tag_sync_log_target_check" CHECK (target = ANY (ARRAY['web'::text, 'discord'::text]))
);
--> statement-breakpoint
ALTER TABLE "tag_sync_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"created_by" uuid,
	"deleted_at" timestamp with time zone,
	"tag_type" "tag_type" DEFAULT 'content',
	"discord_role_name" text,
	"discord_role_id" text,
	"is_user_assignable" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_hack_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hack_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_hack_completions_user_id_hack_id_key" UNIQUE("user_id","hack_id")
);
--> statement-breakpoint
ALTER TABLE "user_hack_completions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_hack_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hack_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_hack_likes_user_id_hack_id_key" UNIQUE("user_id","hack_id")
);
--> statement-breakpoint
ALTER TABLE "user_hack_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_tags" (
	"user_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"source" "tag_source" DEFAULT 'system',
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "user_tags_pkey" PRIMARY KEY("user_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "user_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hack_prerequisites" ADD CONSTRAINT "hack_prerequisites_hack_id_fkey" FOREIGN KEY ("hack_id") REFERENCES "public"."hacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hack_prerequisites" ADD CONSTRAINT "hack_prerequisites_prerequisite_hack_id_fkey" FOREIGN KEY ("prerequisite_hack_id") REFERENCES "public"."hacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hack_tags" ADD CONSTRAINT "hack_tags_hack_id_fkey" FOREIGN KEY ("hack_id") REFERENCES "public"."hacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hack_tags" ADD CONSTRAINT "hack_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hack_tags" ADD CONSTRAINT "hack_tags_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hacks" ADD CONSTRAINT "hacks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_responses" ADD CONSTRAINT "onboarding_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_responses" ADD CONSTRAINT "onboarding_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_sync_log" ADD CONSTRAINT "tag_sync_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_sync_log" ADD CONSTRAINT "tag_sync_log_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_hack_completions" ADD CONSTRAINT "user_hack_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_hack_completions" ADD CONSTRAINT "user_hack_completions_hack_id_fkey" FOREIGN KEY ("hack_id") REFERENCES "public"."hacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_hack_likes" ADD CONSTRAINT "user_hack_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_hack_likes" ADD CONSTRAINT "user_hack_likes_hack_id_fkey" FOREIGN KEY ("hack_id") REFERENCES "public"."hacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_hack_prerequisites_hack_id" ON "hack_prerequisites" USING btree ("hack_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_hack_prerequisites_prerequisite_hack_id" ON "hack_prerequisites" USING btree ("prerequisite_hack_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_hack_tags_hack_id" ON "hack_tags" USING btree ("hack_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_hack_tags_tag_id" ON "hack_tags" USING btree ("tag_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_onboarding_responses_user_id" ON "onboarding_responses" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_profiles_discord_id" ON "profiles" USING btree ("discord_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_profiles_discord_roles" ON "profiles" USING gin ("discord_roles" array_ops);--> statement-breakpoint
CREATE INDEX "idx_profiles_is_admin" ON "profiles" USING btree ("is_admin" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_question_options_question_id" ON "question_options" USING btree ("question_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_question_options_sort_order" ON "question_options" USING btree ("sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_questions_is_active" ON "questions" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_questions_sort_order" ON "questions" USING btree ("sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_tag_sync_log_created_at" ON "tag_sync_log" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_tag_sync_log_user_id" ON "tag_sync_log" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tags_discord_role_id" ON "tags" USING btree ("discord_role_id" text_ops) WHERE (discord_role_id IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_tags_is_user_assignable" ON "tags" USING btree ("is_user_assignable" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_tags_name_lower" ON "tags" USING btree (lower(name)) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_tags_slug" ON "tags" USING btree ("slug" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_tags_tag_type" ON "tags" USING btree ("tag_type" enum_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_unique_idx" ON "tags" USING btree (lower(name)) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_unique_idx" ON "tags" USING btree ("slug" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_user_hack_completions_hack_id" ON "user_hack_completions" USING btree ("hack_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_hack_completions_user_id" ON "user_hack_completions" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_hack_likes_hack_id" ON "user_hack_likes" USING btree ("hack_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_hack_likes_user_id" ON "user_hack_likes" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_tags_tag_id" ON "user_tags" USING btree ("tag_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_tags_updated_at" ON "user_tags" USING btree ("updated_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_user_tags_user_id" ON "user_tags" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE POLICY "Admin manage prerequisites" ON "hack_prerequisites" AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));--> statement-breakpoint
CREATE POLICY "Public prerequisites read access" ON "hack_prerequisites" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Hack tags are viewable by everyone" ON "hack_tags" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Only admins can manage hack tags" ON "hack_tags" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Public hacks read access" ON "hacks" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Admin create hacks" ON "hacks" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Admin update hacks" ON "hacks" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admin delete hacks" ON "hacks" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own responses" ON "onboarding_responses" AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can manage their own responses" ON "onboarding_responses" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Admins can view all responses" ON "onboarding_responses" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can insert their own profile" ON "profiles" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Users can update their own profile" ON "profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view own profile" ON "profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Admins can view all profiles" ON "profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Service role can update Discord fields" ON "profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Question options are viewable by everyone" ON "question_options" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Only admins can insert question options" ON "question_options" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Only admins can update question options" ON "question_options" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Only admins can delete question options" ON "question_options" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Questions are viewable by everyone" ON "questions" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Only admins can insert questions" ON "questions" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Only admins can update questions" ON "questions" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Only admins can delete questions" ON "questions" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own sync logs" ON "tag_sync_log" AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Admins can view all sync logs" ON "tag_sync_log" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Tags are viewable by everyone" ON "tags" AS PERMISSIVE FOR SELECT TO public USING ((deleted_at IS NULL));--> statement-breakpoint
CREATE POLICY "Only admins can create tags" ON "tags" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Only admins can update tags" ON "tags" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Only admins can delete tags" ON "tags" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Public completions read access" ON "user_hack_completions" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users insert own completions" ON "user_hack_completions" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Public likes read access" ON "user_hack_likes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users insert own likes" ON "user_hack_likes" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users delete own likes" ON "user_hack_likes" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own tags" ON "user_tags" AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Admins can view all user tags" ON "user_tags" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can manage their onboarding tags" ON "user_tags" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Admins can manage all user tags" ON "user_tags" AS PERMISSIVE FOR ALL TO public;