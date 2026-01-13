-- AlterTable
ALTER TABLE "Offer" ADD COLUMN "competitor" TEXT;
ALTER TABLE "Offer" ADD COLUMN "expectedCloseDate" DATETIME;
ALTER TABLE "Offer" ADD COLUMN "feedback" TEXT;
ALTER TABLE "Offer" ADD COLUMN "lostAt" DATETIME;
ALTER TABLE "Offer" ADD COLUMN "probability" INTEGER;
ALTER TABLE "Offer" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "Offer" ADD COLUMN "sentAt" DATETIME;
ALTER TABLE "Offer" ADD COLUMN "statusHistory" TEXT DEFAULT '[]';
ALTER TABLE "Offer" ADD COLUMN "wonAt" DATETIME;

-- CreateTable
CREATE TABLE "Formula" (
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
    CONSTRAINT "Formula_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "Briefing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StabilityTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formulaId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "temperature" TEXT,
    "ph" TEXT,
    "viscosity" TEXT,
    "appearance" TEXT,
    "aroma" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StabilityTest_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "Formula" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formulaId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "dateSent" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sample_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "Formula" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reactor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" REAL NOT NULL,
    "dailyTarget" REAL NOT NULL,
    "plant" TEXT NOT NULL DEFAULT 'Coper',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SalesBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesBudget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "erpId" TEXT,
    "name" TEXT NOT NULL,
    "businessName" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "address" TEXT,
    "contactInfo" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName1" TEXT,
    "lastName2" TEXT,
    "position" TEXT,
    "isCommercial" BOOLEAN NOT NULL DEFAULT false,
    "isTechnical" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "connectedClientName" TEXT,
    "companies" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("companies", "createdAt", "id", "name", "password", "role", "updatedAt", "username") SELECT "companies", "createdAt", "id", "name", "password", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Formula_code_revision_key" ON "Formula"("code", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "Reactor_name_key" ON "Reactor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SalesBudget_year_client_companyId_key" ON "SalesBudget"("year", "client", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_erpId_key" ON "Client"("erpId");
