/*
  Warnings:

  - You are about to drop the column `examId` on the `ExamQuestion` table. All the data in the column will be lost.
  - You are about to drop the `Exam` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExamQuestion" DROP CONSTRAINT "ExamQuestion_examId_fkey";

-- DropIndex
DROP INDEX "ExamQuestion_examId_idx";

-- AlterTable
ALTER TABLE "ExamQuestion" DROP COLUMN "examId";

-- DropTable
DROP TABLE "Exam";
