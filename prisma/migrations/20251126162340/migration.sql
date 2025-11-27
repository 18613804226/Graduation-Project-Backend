/*
  Warnings:

  - The `options` column on the `ExamQuestion` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "ExamQuestion" DROP CONSTRAINT "ExamQuestion_examId_fkey";

-- AlterTable
ALTER TABLE "ExamQuestion" ALTER COLUMN "examId" DROP NOT NULL,
DROP COLUMN "options",
ADD COLUMN     "options" TEXT[];

-- CreateIndex
CREATE INDEX "ExamQuestion_examId_idx" ON "ExamQuestion"("examId");

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "PublishedExam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ExamQuestion_subject_idx" RENAME TO "ExamQuestion_subject_difficulty_questionType_idx";
