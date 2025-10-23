/*
  Warnings:

  - You are about to drop the `UsuarioInscrito` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `fecha` on the `Partido` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacion` on the `Partido` table. All the data in the column will be lost.
  - You are about to drop the column `direccion` on the `Tarjeta` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `Tarjeta` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Tarjeta` table. All the data in the column will be lost.
  - You are about to drop the column `jugadores` on the `Tarjeta` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `Tarjeta` table. All the data in the column will be lost.
  - You are about to drop the column `usuario` on the `Tarjeta` table. All the data in the column will be lost.
  - Added the required column `cancha` to the `Partido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dia` to the `Partido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora` to the `Partido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jugadoresFaltantes` to the `Partido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lugar` to the `Partido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partidoId` to the `Tarjeta` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UsuarioInscrito";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_UsuariosInscriptos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_UsuariosInscriptos_A_fkey" FOREIGN KEY ("A") REFERENCES "Tarjeta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UsuariosInscriptos_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Partido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cancha" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "dia" TEXT NOT NULL,
    "hora" DATETIME NOT NULL,
    "jugadoresFaltantes" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Partido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Partido" ("id", "usuarioId") SELECT "id", "usuarioId" FROM "Partido";
DROP TABLE "Partido";
ALTER TABLE "new_Partido" RENAME TO "Partido";
CREATE TABLE "new_Tarjeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partidoId" INTEGER NOT NULL,
    CONSTRAINT "Tarjeta_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tarjeta" ("id") SELECT "id" FROM "Tarjeta";
DROP TABLE "Tarjeta";
ALTER TABLE "new_Tarjeta" RENAME TO "Tarjeta";
CREATE UNIQUE INDEX "Tarjeta_partidoId_key" ON "Tarjeta"("partidoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_UsuariosInscriptos_AB_unique" ON "_UsuariosInscriptos"("A", "B");

-- CreateIndex
CREATE INDEX "_UsuariosInscriptos_B_index" ON "_UsuariosInscriptos"("B");
