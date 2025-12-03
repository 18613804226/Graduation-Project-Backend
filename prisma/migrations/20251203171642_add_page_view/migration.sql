-- CreateTable
CREATE TABLE "PageView" (
    "id" SERIAL NOT NULL,
    "ip" TEXT,
    "userId" INTEGER,
    "path" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_viewedAt_idx" ON "PageView"("viewedAt");

-- CreateIndex
CREATE INDEX "PageView_ip_idx" ON "PageView"("ip");

-- CreateIndex
CREATE INDEX "PageView_userId_idx" ON "PageView"("userId");
