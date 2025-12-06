/*
  Warnings:

  - You are about to drop the column `isCurrentExam` on the `PublishedExam` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExamQuestion" ADD COLUMN     "isCurrentExam" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PublishedExam" DROP COLUMN "isCurrentExam";
