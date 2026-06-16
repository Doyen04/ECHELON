-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "Guardian_phone_idx" ON "Guardian"("phone");

-- CreateIndex
CREATE INDEX "Guardian_email_idx" ON "Guardian"("email");

-- CreateIndex
CREATE INDEX "ResultBatch_institutionId_uploadedAt_idx" ON "ResultBatch"("institutionId", "uploadedAt");

-- CreateIndex
CREATE INDEX "Student_fullName_idx" ON "Student"("fullName");
