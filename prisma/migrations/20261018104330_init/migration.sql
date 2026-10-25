-- CreateTable
CREATE TABLE "Profile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "bio" TEXT NOT NULL DEFAULT '',
    "dailyTotal" INTEGER NOT NULL DEFAULT 5,
    "reviewCap" INTEGER NOT NULL DEFAULT 30,
    "theme" VARCHAR(10) NOT NULL DEFAULT 'ink',
    "furigana" BOOLEAN NOT NULL DEFAULT true,
    "speechRate" DECIMAL(3,2) NOT NULL DEFAULT 0.8,
    "reminder" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "track" VARCHAR(10) NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "topic" VARCHAR(50) NOT NULL,
    "en" TEXT NOT NULL,
    "zh" TEXT NOT NULL,
    "hint" TEXT NOT NULL DEFAULT '',
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "draft" TEXT,
    "pendingDraft" TEXT,
    "feedbackSource" VARCHAR(10),
    "scoreTotal" INTEGER,
    "scoreJson" TEXT,
    "correctedJson" TEXT,
    "notesJson" TEXT,
    "interviewerJson" TEXT,
    "polished" TEXT,
    "whyBetter" TEXT,
    "japaneseSource" VARCHAR(10),
    "japaneseJson" TEXT,
    "patternsJson" TEXT,
    "readingFixesJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "lang" VARCHAR(2) NOT NULL,
    "dueDate" DATE NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "lang" VARCHAR(2) NOT NULL,
    "rewrite" TEXT,
    "aiScore" INTEGER,
    "result" VARCHAR(10) NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" SERIAL NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" VARCHAR(100) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cost" DECIMAL(10,6) NOT NULL,
    "seconds" DECIMAL(6,1) NOT NULL,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_date_idx" ON "Question"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionId_key" ON "Answer"("questionId");

-- CreateIndex
CREATE INDEX "ReviewSchedule_dueDate_idx" ON "ReviewSchedule"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_questionId_lang_key" ON "ReviewSchedule"("questionId", "lang");

-- CreateIndex
CREATE INDEX "ReviewLog_questionId_idx" ON "ReviewLog"("questionId");

-- CreateIndex
CREATE INDEX "AiUsage_at_idx" ON "AiUsage"("at");

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
