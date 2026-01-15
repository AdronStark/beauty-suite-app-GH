-- CreateTable
CREATE TABLE "RawMaterialExcludedSupplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterialExcludedSupplier_name_key" ON "RawMaterialExcludedSupplier"("name");
