/*
  Warnings:

  - You are about to drop the column `product` on the `Offer` table. All the data in the column will be lost.
  - Added the required column `description` to the `Offer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Borrador',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "inputData" TEXT NOT NULL DEFAULT '{}',
    "resultsSummary" TEXT DEFAULT '{}',
    "code" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "responsableComercial" TEXT,
    "responsableTecnico" TEXT,
    "fechaEntrega" DATETIME,
    "briefingId" TEXT,
    "probability" INTEGER,
    "expectedCloseDate" DATETIME,
    "rejectionReason" TEXT,
    "competitor" TEXT,
    "feedback" TEXT,
    "sentAt" DATETIME,
    "wonAt" DATETIME,
    "lostAt" DATETIME,
    "statusHistory" TEXT DEFAULT '[]',
    CONSTRAINT "Offer_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "Briefing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Offer" ("briefingId", "client", "code", "competitor", "createdAt", "expectedCloseDate", "fechaEntrega", "feedback", "id", "inputData", "lostAt", "probability", "rejectionReason", "responsableComercial", "responsableTecnico", "resultsSummary", "revision", "sentAt", "status", "statusHistory", "updatedAt", "wonAt", "description") SELECT "briefingId", "client", "code", "competitor", "createdAt", "expectedCloseDate", "fechaEntrega", "feedback", "id", "inputData", "lostAt", "probability", "rejectionReason", "responsableComercial", "responsableTecnico", "resultsSummary", "revision", "sentAt", "status", "statusHistory", "updatedAt", "wonAt", "product" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
CREATE UNIQUE INDEX "Offer_code_revision_key" ON "Offer"("code", "revision");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
