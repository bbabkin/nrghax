-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserHackStatus_new" AS ENUM ('interested', 'liked', 'visited');
ALTER TYPE "public"."UserHackStatus" RENAME TO "UserHackStatus_old";
ALTER TYPE "public"."UserHackStatus_new" RENAME TO "UserHackStatus";
DROP TYPE "public"."UserHackStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."hacks" DROP CONSTRAINT "hacks_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_hacks" DROP CONSTRAINT "user_hacks_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_tags" DROP CONSTRAINT "user_tags_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."hacks" ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "time_minutes" INTEGER;

-- AlterTable
ALTER TABLE "public"."tags" ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "tag_type" TEXT NOT NULL DEFAULT 'hack';

-- AlterTable
ALTER TABLE "public"."user_hacks" ADD COLUMN     "liked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."user_tags" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'system';

-- DropTable
DROP TABLE "public"."profiles";

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."routines" (
    "id" UUID NOT NULL,
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
CREATE TABLE "public"."routine_hacks" (
    "id" UUID NOT NULL,
    "routine_id" UUID NOT NULL,
    "hack_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_hacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."routine_tags" (
    "routine_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_tags_pkey" PRIMARY KEY ("routine_id","tag_id")
);

-- CreateTable
CREATE TABLE "public"."user_routines" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "routine_id" UUID NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "started" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_routines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "public"."accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "routines_slug_key" ON "public"."routines"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "routine_hacks_routine_id_hack_id_key" ON "public"."routine_hacks"("routine_id", "hack_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_routines_user_id_routine_id_key" ON "public"."user_routines"("user_id", "routine_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "public"."tags"("slug");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hacks" ADD CONSTRAINT "hacks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_hacks" ADD CONSTRAINT "user_hacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_tags" ADD CONSTRAINT "user_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routines" ADD CONSTRAINT "routines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routine_hacks" ADD CONSTRAINT "routine_hacks_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routine_hacks" ADD CONSTRAINT "routine_hacks_hack_id_fkey" FOREIGN KEY ("hack_id") REFERENCES "public"."hacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routine_tags" ADD CONSTRAINT "routine_tags_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routine_tags" ADD CONSTRAINT "routine_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_routines" ADD CONSTRAINT "user_routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_routines" ADD CONSTRAINT "user_routines_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

