-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'PENDING');

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "url" TEXT NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);
