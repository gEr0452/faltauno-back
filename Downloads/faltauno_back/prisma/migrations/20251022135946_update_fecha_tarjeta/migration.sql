/*
  Warnings:

  - You are about to drop the column `resultado` on the `Partido` table. All the data in the column will be lost.
  - You are about to alter the column `fecha` on the `Tarjeta` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Partido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Partido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Partido" ("fecha", "id", "ubicacion", "usuarioId") SELECT "fecha", "id", "ubicacion", "usuarioId" FROM "Partido";
DROP TABLE "Partido";
ALTER TABLE "new_Partido" RENAME TO "Partido";
CREATE TABLE "new_Tarjeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "jugadores" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "image" TEXT,
    "usuario" TEXT NOT NULL
);
INSERT INTO "new_Tarjeta" ("direccion", "fecha", "id", "image", "jugadores", "nombre", "usuario") SELECT "direccion", "fecha", "id", "image", "jugadores", "nombre", "usuario" FROM "Tarjeta";
DROP TABLE "Tarjeta";
ALTER TABLE "new_Tarjeta" RENAME TO "Tarjeta";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
