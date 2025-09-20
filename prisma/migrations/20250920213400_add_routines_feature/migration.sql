-- CreateEnum
ALTER TYPE "UserHackStatus" ADD VALUE 'visited';

-- AlterTable
ALTER TABLE "hacks" ADD COLUMN "difficulty" TEXT,
ADD COLUMN "time_minutes" INTEGER;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN "description" TEXT,
ADD COLUMN "slug" TEXT,
ADD COLUMN "tag_type" TEXT;

-- AlterTable
ALTER TABLE "user_hacks" ADD COLUMN "liked" BOOLEAN DEFAULT false,
ADD COLUMN "viewed" BOOLEAN DEFAULT false,
ADD COLUMN "viewed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_tags" ADD COLUMN "source" TEXT DEFAULT 'manual';

-- CreateTable
CREATE TABLE "routines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "image_path" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_hacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "routine_id" UUID NOT NULL,
    "hack_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_hacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_tags" (
    "routine_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_tags_pkey" PRIMARY KEY ("routine_id","tag_id")
);

-- CreateTable
CREATE TABLE "user_routines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "routine_id" UUID NOT NULL,
    "started" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_routines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routines_slug_key" ON "routines"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "routine_hacks_routine_id_hack_id_key" ON "routine_hacks"("routine_id", "hack_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_routines_user_id_routine_id_key" ON "user_routines"("user_id", "routine_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_hacks" ADD CONSTRAINT "routine_hacks_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_hacks" ADD CONSTRAINT "routine_hacks_hack_id_fkey" FOREIGN KEY ("hack_id") REFERENCES "hacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_tags" ADD CONSTRAINT "routine_tags_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_tags" ADD CONSTRAINT "routine_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_routines" ADD CONSTRAINT "user_routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_routines" ADD CONSTRAINT "user_routines_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;