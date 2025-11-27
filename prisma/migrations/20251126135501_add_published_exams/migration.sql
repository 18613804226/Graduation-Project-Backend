-- CreateTable
CREATE TABLE "PublishedExam" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "PublishedExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublishedExam_title_key" ON "PublishedExam"("title");

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "PublishedExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
