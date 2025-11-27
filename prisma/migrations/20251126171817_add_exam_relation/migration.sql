-- DropForeignKey
ALTER TABLE "ExamQuestion" DROP CONSTRAINT "ExamQuestion_examId_fkey";

-- AlterTable
ALTER TABLE "ExamQuestion" ADD COLUMN     "publishedExamId" INTEGER;

-- CreateTable
CREATE TABLE "Exam" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_publishedExamId_fkey" FOREIGN KEY ("publishedExamId") REFERENCES "PublishedExam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
