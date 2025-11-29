-- CreateTable
CREATE TABLE "ExamTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,

    CONSTRAINT "ExamTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSection" (
    "id" SERIAL NOT NULL,
    "questionType" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,

    CONSTRAINT "ExamSection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExamSection" ADD CONSTRAINT "ExamSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ExamTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
