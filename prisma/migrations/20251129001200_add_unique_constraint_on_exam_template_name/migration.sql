/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ExamTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ExamTemplate_name_key" ON "ExamTemplate"("name");
