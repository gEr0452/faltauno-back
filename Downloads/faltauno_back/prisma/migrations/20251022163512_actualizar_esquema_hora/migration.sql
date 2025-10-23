-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Partido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cancha" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "dia" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "jugadoresFaltantes" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Partido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Partido" ("cancha", "dia", "hora", "id", "jugadoresFaltantes", "lugar", "usuarioId") SELECT "cancha", "dia", "hora", "id", "jugadoresFaltantes", "lugar", "usuarioId" FROM "Partido";
DROP TABLE "Partido";
ALTER TABLE "new_Partido" RENAME TO "Partido";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
