-- CreateIndex
CREATE INDEX "Comment_parentId_createdAt_id_idx" ON "Comment"("parentId", "createdAt" DESC, "id" DESC);
