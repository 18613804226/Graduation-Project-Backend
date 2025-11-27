-- 先加字段（允许为空）
ALTER TABLE "ExamQuestion"
ADD COLUMN "subject" TEXT,
ADD COLUMN "difficulty" TEXT,
ADD COLUMN "questionType" TEXT;

-- 从 PublishedExam 自动填充分类信息
UPDATE "ExamQuestion"
SET 
  "subject" = pe."subject",
  "difficulty" = pe."difficulty",
  "questionType" = pe."questionType"
FROM "PublishedExam" AS pe
WHERE "ExamQuestion"."examId" = pe."id";

-- 设为非空（现在已有值）
ALTER TABLE "ExamQuestion"
ALTER COLUMN "subject" SET NOT NULL,
ALTER COLUMN "difficulty" SET NOT NULL,
ALTER COLUMN "questionType" SET NOT NULL;

-- 加索引（提升随机抽题速度）
CREATE INDEX "ExamQuestion_subject_idx" ON "ExamQuestion" ("subject", "difficulty", "questionType");