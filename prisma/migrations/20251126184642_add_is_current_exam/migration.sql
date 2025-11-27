-- AlterTable
ALTER TABLE "ExamQuestion" ADD COLUMN     "isCurrentExam" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ExamQuestion_isCurrentExam_idx" ON "ExamQuestion"("isCurrentExam");
