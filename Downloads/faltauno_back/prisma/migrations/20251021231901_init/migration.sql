-- CreateTable
CREATE TABLE "Tarjeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "jugadores" INTEGER NOT NULL,
    "fecha" TEXT NOT NULL,
    "image" TEXT,
    "usuario" TEXT NOT NULL
);
