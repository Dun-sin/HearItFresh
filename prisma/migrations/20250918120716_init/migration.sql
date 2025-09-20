-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "profile_image_url" TEXT,
    "history" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);
