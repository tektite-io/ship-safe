-- CreateTable
CREATE TABLE "ContentAgentRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'draft',
    "status" TEXT NOT NULL DEFAULT 'running',
    "config" JSONB,
    "selectedTopic" JSONB,
    "candidateCount" INTEGER NOT NULL DEFAULT 0,
    "selectedCount" INTEGER NOT NULL DEFAULT 0,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "guardrails" JSONB NOT NULL DEFAULT '[]',
    "error" TEXT,
    "draftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ContentAgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sourceTopic" JSONB,
    "citations" JSONB NOT NULL DEFAULT '[]',
    "guardrails" JSONB NOT NULL DEFAULT '[]',
    "publishedUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentAgentRun_userId_createdAt_idx" ON "ContentAgentRun"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ContentAgentRun_status_createdAt_idx" ON "ContentAgentRun"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ContentDraft_slug_key" ON "ContentDraft"("slug");

-- CreateIndex
CREATE INDEX "ContentDraft_userId_createdAt_idx" ON "ContentDraft"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ContentDraft_status_createdAt_idx" ON "ContentDraft"("status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ContentAgentRun" ADD CONSTRAINT "ContentAgentRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAgentRun" ADD CONSTRAINT "ContentAgentRun_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ContentDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
