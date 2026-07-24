-- AlterTable
ALTER TABLE "Partido" ADD COLUMN "fechaHora" DATETIME;
ALTER TABLE "Partido" ADD COLUMN "latitud" REAL;
ALTER TABLE "Partido" ADD COLUMN "longitud" REAL;
ALTER TABLE "Partido" ADD COLUMN "posicionFaltante" TEXT;

-- CreateTable
CREATE TABLE "Resena" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "autorId" INTEGER NOT NULL,
    "receptorId" INTEGER NOT NULL,
    "partidoId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Resena_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Resena_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Resena_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Resena_autorId_receptorId_partidoId_key" ON "Resena"("autorId", "receptorId", "partidoId");
