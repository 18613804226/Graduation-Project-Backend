-- AlterTable
ALTER TABLE "ExamTemplate" ADD COLUMN     "courseId" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "ExamTemplate" ADD CONSTRAINT "ExamTemplate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
