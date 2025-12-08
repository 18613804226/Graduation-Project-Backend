-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "content" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "videoUrl" TEXT;
