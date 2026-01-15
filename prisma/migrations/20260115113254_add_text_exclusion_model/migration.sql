-- CreateTable
CREATE TABLE "RawMaterialExcludedTerm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "term" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
