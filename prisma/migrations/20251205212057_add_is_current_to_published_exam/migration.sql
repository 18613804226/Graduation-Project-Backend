/*
  Warnings:

  - You are about to drop the column `isCurrentExam` on the `ExamQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `optionsHash` on the `ExamQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `questionType` on the `PublishedExam` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ExamQuestion_isCurrentExam_idx";

-- DropIndex
DROP INDEX "ExamQuestion_subject_difficulty_questionType_idx";

-- AlterTable
ALTER TABLE "ExamQuestion" DROP COLUMN "isCurrentExam",
DROP COLUMN "optionsHash";

-- AlterTable
ALTER TABLE "PublishedExam" DROP COLUMN "questionType",
ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateId" INTEGER;

-- AddForeignKey
ALTER TABLE "PublishedExam" ADD CONSTRAINT "PublishedExam_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ExamTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
