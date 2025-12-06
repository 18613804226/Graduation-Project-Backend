-- CreateIndex
CREATE INDEX "ExamQuestion_publishedExamId_idx" ON "ExamQuestion"("publishedExamId");

-- CreateIndex
CREATE INDEX "PublishedExam_isCurrent_idx" ON "PublishedExam"("isCurrent");
