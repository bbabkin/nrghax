import { pgTable, index, foreignKey, unique, pgPolicy, uuid, text, timestamp, boolean, check, uniqueIndex, integer, jsonb, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const tagSource = pgEnum("tag_source", ['onboarding', 'discord', 'admin', 'system'])
export const tagType = pgEnum("tag_type", ['user_experience', 'user_interest', 'user_special', 'content'])


export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	isAdmin: boolean("is_admin").default(false),
	discordId: text("discord_id"),
	discordUsername: text("discord_username"),
	discordRoles: text("discord_roles").array().default([""]),
}, (table) => [
	index("idx_profiles_discord_id").using("btree", table.discordId.asc().nullsLast().op("text_ops")),
	index("idx_profiles_discord_roles").using("gin", table.discordRoles.asc().nullsLast().op("array_ops")),
	index("idx_profiles_is_admin").using("btree", table.isAdmin.asc().nullsLast().op("bool_ops")),
	unique("profiles_email_key").on(table.email),
	unique("profiles_discord_id_key").on(table.discordId),
	pgPolicy("Users can insert their own profile", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(auth.uid() = id)`  }),
	pgPolicy("Users can update their own profile", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can view own profile", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins can view all profiles", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Service role can update Discord fields", { as: "permissive", for: "update", to: ["public"] }),
]);

export const hackPrerequisites = pgTable("hack_prerequisites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	hackId: uuid("hack_id").notNull(),
	prerequisiteHackId: uuid("prerequisite_hack_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_hack_prerequisites_hack_id").using("btree", table.hackId.asc().nullsLast().op("uuid_ops")),
	index("idx_hack_prerequisites_prerequisite_hack_id").using("btree", table.prerequisiteHackId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.hackId],
			foreignColumns: [hacks.id],
			name: "hack_prerequisites_hack_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.prerequisiteHackId],
			foreignColumns: [hacks.id],
			name: "hack_prerequisites_prerequisite_hack_id_fkey"
		}).onDelete("cascade"),
	unique("hack_prerequisites_hack_id_prerequisite_hack_id_key").on(table.hackId, table.prerequisiteHackId),
	pgPolicy("Admin manage prerequisites", { as: "permissive", for: "all", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))` }),
	pgPolicy("Public prerequisites read access", { as: "permissive", for: "select", to: ["public"] }),
	check("no_self_prerequisite", sql`hack_id <> prerequisite_hack_id`),
]);

export const userHackCompletions = pgTable("user_hack_completions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	hackId: uuid("hack_id").notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_user_hack_completions_hack_id").using("btree", table.hackId.asc().nullsLast().op("uuid_ops")),
	index("idx_user_hack_completions_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "user_hack_completions_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.hackId],
			foreignColumns: [hacks.id],
			name: "user_hack_completions_hack_id_fkey"
		}).onDelete("cascade"),
	unique("user_hack_completions_user_id_hack_id_key").on(table.userId, table.hackId),
	pgPolicy("Public completions read access", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users insert own completions", { as: "permissive", for: "insert", to: ["public"] }),
]);

export const userHackLikes = pgTable("user_hack_likes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	hackId: uuid("hack_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_user_hack_likes_hack_id").using("btree", table.hackId.asc().nullsLast().op("uuid_ops")),
	index("idx_user_hack_likes_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "user_hack_likes_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.hackId],
			foreignColumns: [hacks.id],
			name: "user_hack_likes_hack_id_fkey"
		}).onDelete("cascade"),
	unique("user_hack_likes_user_id_hack_id_key").on(table.userId, table.hackId),
	pgPolicy("Public likes read access", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users insert own likes", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users delete own likes", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const hacks = pgTable("hacks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	imageUrl: text("image_url"),
	contentType: text("content_type").notNull(),
	contentBody: text("content_body"),
	externalLink: text("external_link"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by"),
	imagePath: text("image_path"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "hacks_created_by_fkey"
		}).onDelete("set null"),
	pgPolicy("Public hacks read access", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Admin create hacks", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admin update hacks", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admin delete hacks", { as: "permissive", for: "delete", to: ["public"] }),
	check("hacks_content_type_check", sql`content_type = ANY (ARRAY['content'::text, 'link'::text])`),
	check("content_xor_link", sql`((content_type = 'content'::text) AND (content_body IS NOT NULL) AND (external_link IS NULL)) OR ((content_type = 'link'::text) AND (external_link IS NOT NULL) AND (content_body IS NULL))`),
	check("hacks_image_check", sql`(image_url IS NOT NULL) OR (image_path IS NOT NULL)`),
]);

export const tags = pgTable("tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	createdBy: uuid("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	tagType: tagType("tag_type").default('content'),
	discordRoleName: text("discord_role_name"),
	discordRoleId: text("discord_role_id"),
	isUserAssignable: boolean("is_user_assignable").default(false),
	displayOrder: integer("display_order").default(0),
	description: text(),
}, (table) => [
	index("idx_tags_discord_role_id").using("btree", table.discordRoleId.asc().nullsLast().op("text_ops")).where(sql`(discord_role_id IS NOT NULL)`),
	index("idx_tags_is_user_assignable").using("btree", table.isUserAssignable.asc().nullsLast().op("bool_ops")),
	index("idx_tags_name_lower").using("btree", sql`lower(name)`).where(sql`(deleted_at IS NULL)`),
	index("idx_tags_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_tags_tag_type").using("btree", table.tagType.asc().nullsLast().op("enum_ops")),
	uniqueIndex("tags_name_unique_idx").using("btree", sql`lower(name)`).where(sql`(deleted_at IS NULL)`),
	uniqueIndex("tags_slug_unique_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "tags_created_by_fkey"
		}).onDelete("set null"),
	pgPolicy("Tags are viewable by everyone", { as: "permissive", for: "select", to: ["public"], using: sql`(deleted_at IS NULL)` }),
	pgPolicy("Only admins can create tags", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Only admins can update tags", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Only admins can delete tags", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const tagSyncLog = pgTable("tag_sync_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	tagId: uuid("tag_id"),
	action: text(),
	source: tagSource().notNull(),
	target: text(),
	previousValue: jsonb("previous_value"),
	newValue: jsonb("new_value"),
	conflictDetails: jsonb("conflict_details"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	index("idx_tag_sync_log_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_tag_sync_log_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "tag_sync_log_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "tag_sync_log_tag_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view their own sync logs", { as: "permissive", for: "select", to: ["public"], using: sql`(user_id = auth.uid())` }),
	pgPolicy("Admins can view all sync logs", { as: "permissive", for: "select", to: ["public"] }),
	check("tag_sync_log_action_check", sql`action = ANY (ARRAY['added'::text, 'removed'::text, 'conflict_resolved'::text])`),
	check("tag_sync_log_target_check", sql`target = ANY (ARRAY['web'::text, 'discord'::text])`),
]);

export const onboardingResponses = pgTable("onboarding_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	questionId: text("question_id").notNull(),
	answer: jsonb().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	skipped: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	index("idx_onboarding_responses_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "onboarding_responses_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "onboarding_responses_question_id_fkey"
		}).onDelete("cascade"),
	unique("onboarding_responses_user_id_question_id_key").on(table.userId, table.questionId),
	pgPolicy("Users can view their own responses", { as: "permissive", for: "select", to: ["public"], using: sql`(user_id = auth.uid())` }),
	pgPolicy("Users can manage their own responses", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Admins can view all responses", { as: "permissive", for: "select", to: ["public"] }),
]);

export const questions = pgTable("questions", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	type: text().notNull(),
	category: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
}, (table) => [
	index("idx_questions_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_questions_sort_order").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	pgPolicy("Questions are viewable by everyone", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Only admins can insert questions", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Only admins can update questions", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Only admins can delete questions", { as: "permissive", for: "delete", to: ["public"] }),
	check("questions_type_check", sql`type = ANY (ARRAY['single'::text, 'multiple'::text])`),
	check("questions_category_check", sql`category = ANY (ARRAY['experience'::text, 'interests'::text, 'goals'::text, 'time'::text, 'difficulty'::text])`),
]);

export const questionOptions = pgTable("question_options", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	questionId: text("question_id").notNull(),
	value: text().notNull(),
	label: text().notNull(),
	description: text(),
	icon: text(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
}, (table) => [
	index("idx_question_options_question_id").using("btree", table.questionId.asc().nullsLast().op("text_ops")),
	index("idx_question_options_sort_order").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "question_options_question_id_fkey"
		}).onDelete("cascade"),
	unique("question_options_question_id_value_key").on(table.questionId, table.value),
	pgPolicy("Question options are viewable by everyone", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Only admins can insert question options", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Only admins can update question options", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Only admins can delete question options", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const hackTags = pgTable("hack_tags", {
	hackId: uuid("hack_id").notNull(),
	tagId: uuid("tag_id").notNull(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	assignedBy: uuid("assigned_by"),
}, (table) => [
	index("idx_hack_tags_hack_id").using("btree", table.hackId.asc().nullsLast().op("uuid_ops")),
	index("idx_hack_tags_tag_id").using("btree", table.tagId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.hackId],
			foreignColumns: [hacks.id],
			name: "hack_tags_hack_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "hack_tags_tag_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [profiles.id],
			name: "hack_tags_assigned_by_fkey"
		}).onDelete("set null"),
	primaryKey({ columns: [table.hackId, table.tagId], name: "hack_tags_pkey"}),
	pgPolicy("Hack tags are viewable by everyone", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Only admins can manage hack tags", { as: "permissive", for: "all", to: ["public"] }),
]);

export const userTags = pgTable("user_tags", {
	userId: uuid("user_id").notNull(),
	tagId: uuid("tag_id").notNull(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	source: tagSource().default('system'),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	index("idx_user_tags_tag_id").using("btree", table.tagId.asc().nullsLast().op("uuid_ops")),
	index("idx_user_tags_updated_at").using("btree", table.updatedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_user_tags_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "user_tags_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "user_tags_tag_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.tagId], name: "user_tags_pkey"}),
	pgPolicy("Users can view their own tags", { as: "permissive", for: "select", to: ["public"], using: sql`(user_id = auth.uid())` }),
	pgPolicy("Admins can view all user tags", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can manage their onboarding tags", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Admins can manage all user tags", { as: "permissive", for: "all", to: ["public"] }),
]);
