-- DropIndex
DROP INDEX "Lesson_order_idx";

-- CreateIndex
CREATE INDEX "Lesson_courseId_order_idx" ON "Lesson"("courseId", "order");
