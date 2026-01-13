-- CreateTable
CREATE TABLE "Briefing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "clientName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Borrador',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "responsableComercial" TEXT,
    "responsableTecnico" TEXT,
    "targetDate" DATETIME,
    "formData" TEXT NOT NULL DEFAULT '{}',
    "imagePaths" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client" TEXT NOT NULL,
    "product" TEXT NOT NULL,
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
    CONSTRAINT "Offer_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "Briefing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "erpId" TEXT,
    "articleCode" TEXT NOT NULL,
    "articleDesc" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "orderNumber" TEXT,
    "units" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "deadline" DATETIME,
    "orderDate" DATETIME,
    "plannedDate" DATETIME,
    "plannedReactor" TEXT,
    "plannedShift" TEXT,
    "batchLabel" TEXT,
    "unitsOrdered" REAL,
    "unitsServed" REAL,
    "unitsPending" REAL,
    "realKg" REAL,
    "realDuration" INTEGER,
    "operatorNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReactorMaintenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reactorId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Configuration" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "companies" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Briefing_code_revision_key" ON "Briefing"("code", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_code_revision_key" ON "Offer"("code", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
