-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "diasDisponibles" TEXT,
    "horariosDisponibles" TEXT,
    "barriosPreferidos" TEXT,
    "imagen" TEXT
);

-- CreateTable
CREATE TABLE "Partido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cancha" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "dia" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "jugadoresFaltantes" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Partido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tarjeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partidoId" INTEGER NOT NULL,
    "imagen" TEXT,
    CONSTRAINT "Tarjeta_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_UsuariosInscriptos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_UsuariosInscriptos_A_fkey" FOREIGN KEY ("A") REFERENCES "Tarjeta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UsuariosInscriptos_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Tarjeta_partidoId_key" ON "Tarjeta"("partidoId");

-- CreateIndex
CREATE UNIQUE INDEX "_UsuariosInscriptos_AB_unique" ON "_UsuariosInscriptos"("A", "B");

-- CreateIndex
CREATE INDEX "_UsuariosInscriptos_B_index" ON "_UsuariosInscriptos"("B");
