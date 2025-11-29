-- DropForeignKey
ALTER TABLE "ExamSection" DROP CONSTRAINT "ExamSection_templateId_fkey";

-- AddForeignKey
ALTER TABLE "ExamSection" ADD CONSTRAINT "ExamSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ExamTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
