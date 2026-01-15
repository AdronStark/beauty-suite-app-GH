-- CreateTable
CREATE TABLE "UserAppRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserAppRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RawMaterialOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "erpId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "orderYear" INTEGER,
    "articleCode" TEXT NOT NULL,
    "articleName" TEXT NOT NULL,
    "unitsOrdered" REAL NOT NULL,
    "unitsReceived" REAL NOT NULL,
    "unitsPending" REAL NOT NULL,
    "orderDate" DATETIME,
    "deliveryDate" DATETIME,
    "expectedDate" DATETIME,
    "status" TEXT,
    "supplierName" TEXT,
    "notes" TEXT,
    "associatedOE" TEXT,
    "manualReceptionDate" DATETIME,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_ClientToFormula" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ClientToFormula_A_fkey" FOREIGN KEY ("A") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ClientToFormula_B_fkey" FOREIGN KEY ("B") REFERENCES "Formula" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Formula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "ingredients" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "briefingId" TEXT,
    "code" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "ownership" TEXT NOT NULL DEFAULT 'PROPIA',
    CONSTRAINT "Formula_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "Briefing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Formula" ("briefingId", "category", "code", "createdAt", "description", "id", "ingredients", "name", "revision", "status", "updatedAt") SELECT "briefingId", "category", "code", "createdAt", "description", "id", "ingredients", "name", "revision", "status", "updatedAt" FROM "Formula";
DROP TABLE "Formula";
ALTER TABLE "new_Formula" RENAME TO "Formula";
CREATE UNIQUE INDEX "Formula_code_revision_key" ON "Formula"("code", "revision");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserAppRole_userId_appId_key" ON "UserAppRole"("userId", "appId");

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterialOrder_erpId_key" ON "RawMaterialOrder"("erpId");

-- CreateIndex
CREATE UNIQUE INDEX "_ClientToFormula_AB_unique" ON "_ClientToFormula"("A", "B");

-- CreateIndex
CREATE INDEX "_ClientToFormula_B_index" ON "_ClientToFormula"("B");
