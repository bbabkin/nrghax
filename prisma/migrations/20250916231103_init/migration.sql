-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('content', 'link');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('single_choice', 'multiple_choice', 'text');

-- CreateEnum
CREATE TYPE "public"."TagSource" AS ENUM ('web', 'discord', 'onboarding', 'admin', 'system');

-- CreateEnum
CREATE TYPE "public"."TagType" AS ENUM ('user_experience', 'user_interest', 'user_special', 'content');

-- CreateEnum
CREATE TYPE "public"."UserHackStatus" AS ENUM ('interested', 'liked', 'completed');

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hacks" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "image_path" TEXT,
    "content_type" TEXT NOT NULL DEFAULT 'content',
    "content_body" TEXT,
    "external_link" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "hacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_hacks" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "hack_id" UUID,
    "status" TEXT,
    "started_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_hacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hack_prerequisites" (
    "id" UUID NOT NULL,
    "hack_id" UUID,
    "prerequisite_hack_id" UUID,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hack_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hack_tags" (
    "hack_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hack_tags_pkey" PRIMARY KEY ("hack_id","tag_id")
);

-- CreateTable
CREATE TABLE "public"."user_tags" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "tag_id" UUID,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "public"."profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "public"."tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_hacks_user_id_hack_id_key" ON "public"."user_hacks"("user_id", "hack_id");

-- CreateIndex
CREATE UNIQUE INDEX "hack_prerequisites_hack_id_prerequisite_hack_id_key" ON "public"."hack_prerequisites"("hack_id", "prerequisite_hack_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_tags_user_id_tag_id_key" ON "public"."user_tags"("user_id", "tag_id");

-- AddForeignKey
ALTER TABLE "public"."hacks" ADD CONSTRAINT "hacks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_hacks" ADD CONSTRAINT "user_hacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_hacks" ADD CONSTRAINT "user_hacks_hack_id_fkey" FOREIGN KEY ("hack_id") REFERENCES "public"."hacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hack_prerequisites" ADD CONSTRAINT "hack_prerequisites_hack_id_fkey" FOREIGN KEY ("hack_id") REFERENCES "public"."hacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hack_prerequisites" ADD CONSTRAINT "hack_prerequisites_prerequisite_hack_id_fkey" FOREIGN KEY ("prerequisite_hack_id") REFERENCES "public"."hacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hack_tags" ADD CONSTRAINT "hack_tags_hack_id_fkey" FOREIGN KEY ("hack_id") REFERENCES "public"."hacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hack_tags" ADD CONSTRAINT "hack_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_tags" ADD CONSTRAINT "user_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_tags" ADD CONSTRAINT "user_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
