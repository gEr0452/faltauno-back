-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UsuarioInscrito" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "tarjetaId" INTEGER,
    CONSTRAINT "UsuarioInscrito_tarjetaId_fkey" FOREIGN KEY ("tarjetaId") REFERENCES "Tarjeta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UsuarioInscrito" ("id", "nombre", "tarjetaId") SELECT "id", "nombre", "tarjetaId" FROM "UsuarioInscrito";
DROP TABLE "UsuarioInscrito";
ALTER TABLE "new_UsuarioInscrito" RENAME TO "UsuarioInscrito";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
