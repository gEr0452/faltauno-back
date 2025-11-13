import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: ['http://localhost:8081', 'exp://192.168.1.3:8081'], // URLs de Expo
  credentials: true
}));
app.use(express.json());

// Crear un nuevo partido y su tarjeta asociada
app.post("/partidos", async (req, res) => {
  try {
    console.log("📩 Datos recibidos en backend:", req.body);
    
    type PartidoRequestBody = {
      cancha: string;
      lugar: string;
      dia: string;
      hora: string;
      jugadoresFaltantes: string;
      usuarioId: string;
      imagen?: string; 
    }
    
    const { 
      cancha, 
      lugar, 
      dia, 
      hora, 
      jugadoresFaltantes, 
      usuarioId, 
      imagen 
    }: PartidoRequestBody = req.body;

    // Crear el partido
    const partido = await prisma.partido.create({
      data: {
        cancha,
        lugar,
        dia,
        hora,
        jugadoresFaltantes: parseInt(jugadoresFaltantes),
        usuario: { connect: { id: parseInt(usuarioId) } },
      },
    });

    // Crear su tarjeta asociada automáticamente CON LA IMAGEN
    const tarjeta = await prisma.tarjeta.create({
      data: { 
        partido: { connect: { id: partido.id } },
        imagen: imagen || null 
      },
    });

    res.json({ mensaje: "Partido y tarjeta creados correctamente", partido, tarjeta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear el partido" });
  }
});

// Obtener todos los partidos
app.get("/partidos", async (req, res) => {
  try {
    const partidos = await prisma.partido.findMany({
      include: {
        usuario: true,
        tarjeta: { include: { usuarios: true } },
      },
      orderBy: { hora: "desc" },
    });
    res.json(partidos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener partidos" });
  }
});

// Obtener todas las tarjetas con su partido y usuarios inscritos
app.get("/tarjetas", async (req, res) => {
  try {
    const tarjetas = await prisma.tarjeta.findMany({
      include: { partido: true, usuarios: true },
      orderBy: { id: "desc" },
    });

    const tarjetasFormateadas = tarjetas.map((tarjeta) => ({
      id: tarjeta.id,
      nombre: tarjeta.partido.cancha,
      direccion: tarjeta.partido.lugar,
      jugadores: tarjeta.partido.jugadoresFaltantes,
      fecha: `${tarjeta.partido.dia} ${tarjeta.partido.hora}`,
      image: tarjeta.imagen,
      usuario: `Usuario ${tarjeta.partido.usuarioId}`,
      inscritos: tarjeta.usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
      })),
    }));

    res.json(tarjetasFormateadas); 
  } catch (err) {
    console.error("Error al obtener tarjetas:", err);
    res.status(500).json({ error: "Error al obtener tarjetas" });
  }
});


// Inscribir usuario en una tarjeta
app.post("/tarjetas/:id/inscribir", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;

    const tarjetaId = parseInt(id, 10);
    const usuarioIdNumber = parseInt(usuarioId, 10);

    if (isNaN(tarjetaId) || isNaN(usuarioIdNumber)) {
      throw new HttpError(400, "Identificadores inválidos para tarjeta o usuario");
    }

    const tarjetaActualizada = await prisma.$transaction(async (tx) => {
      const tarjeta = await tx.tarjeta.findUnique({
        where: { id: tarjetaId },
        include: { usuarios: true, partido: true },
      });

      if (!tarjeta) {
        throw new HttpError(404, "Tarjeta no encontrada");
      }

      const yaInscripto = tarjeta.usuarios.some((usuario) => usuario.id === usuarioIdNumber);
      if (yaInscripto) {
        throw new HttpError(409, "El usuario ya está inscrito en este partido");
      }

      if (tarjeta.partido.jugadoresFaltantes <= 0) {
        throw new HttpError(409, "No hay cupos disponibles para este partido");
      }

      await tx.partido.update({
        where: { id: tarjeta.partidoId },
        data: { jugadoresFaltantes: { decrement: 1 } },
      });

      return tx.tarjeta.update({
        where: { id: tarjetaId },
        data: {
          usuarios: { connect: { id: usuarioIdNumber } },
        },
        include: { usuarios: true, partido: true },
      });
    });

    res.json(tarjetaActualizada);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Error al inscribir usuario en tarjeta" });
  }
});

// Dar de baja a un usuario de una tarjeta
app.post("/tarjetas/:id/desinscribir", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;

    const tarjetaId = parseInt(id, 10);
    const usuarioIdNumber = parseInt(usuarioId, 10);

    if (isNaN(tarjetaId) || isNaN(usuarioIdNumber)) {
      throw new HttpError(400, "Identificadores inválidos para tarjeta o usuario");
    }

    const tarjetaActualizada = await prisma.$transaction(async (tx) => {
      const tarjeta = await tx.tarjeta.findUnique({
        where: { id: tarjetaId },
        include: { usuarios: true, partido: true },
      });

      if (!tarjeta) {
        throw new HttpError(404, "Tarjeta no encontrada");
      }

      const estaInscripto = tarjeta.usuarios.some((usuario) => usuario.id === usuarioIdNumber);
      if (!estaInscripto) {
        throw new HttpError(409, "El usuario no está inscrito en este partido");
      }

      await tx.tarjeta.update({
        where: { id: tarjetaId },
        data: {
          usuarios: { disconnect: { id: usuarioIdNumber } },
        },
      });

      await tx.partido.update({
        where: { id: tarjeta.partidoId },
        data: { jugadoresFaltantes: { increment: 1 } },
      });

      const tarjetaFinal = await tx.tarjeta.findUnique({
        where: { id: tarjetaId },
        include: { usuarios: true, partido: true },
      });

      if (!tarjetaFinal) {
        throw new HttpError(500, "Error al actualizar la tarjeta");
      }

      return tarjetaFinal;
    });

    res.json(tarjetaActualizada);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Error al dar de baja al usuario en la tarjeta" });
  }
});

// Obtener usuarios inscritos en una tarjeta
app.get("/tarjetas/:id/inscritos", async (req, res) => {
  try {
    const { id } = req.params;
    const tarjeta = await prisma.tarjeta.findUnique({
      where: { id: parseInt(id) },
      include: { usuarios: true },
    });

    if (!tarjeta) return res.status(404).json({ error: "Tarjeta no encontrada" });
    res.json(tarjeta.usuarios);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener inscritos" });
  }
});

app.get("/usuario/:id", async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        nombre: true,
        correo: true,
        diasDisponibles: true,
        horariosDisponibles: true,
        barriosPreferidos: true,
      },
    });

    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

// Actualizar preferencias
app.put("/usuario/:id/preferencias", async (req, res) => {
  try {
    const { diasDisponibles, horariosDisponibles, barriosPreferidos } = req.body;

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(req.params.id) },
      data: { diasDisponibles, horariosDisponibles, barriosPreferidos },
    });

    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar preferencias" });
  }
});

// Obtener partidos creados por el usuario
app.get("/usuario/:id/partidos", async (req, res) => {
  try {
    const partidos = await prisma.partido.findMany({
      where: { usuarioId: parseInt(req.params.id) },
      orderBy: { hora: "desc" },
    });
    res.json(partidos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener partidos" });
  }
});

// Eliminar un partido y su tarjeta asociada
app.delete("/partidos/:id", async (req, res) => {
  try {
    const partidoId = parseInt(req.params.id, 10);

    if (isNaN(partidoId)) {
      return res.status(400).json({ error: "ID de partido inválido" });
    }

    await prisma.$transaction(async (tx) => {
      // Buscar el partido y su tarjeta
      const partido = await tx.partido.findUnique({
        where: { id: partidoId },
        include: { tarjeta: true },
      });

      if (!partido) {
        throw new HttpError(404, "Partido no encontrado");
      }

      // Si tiene tarjeta, eliminar primero la tarjeta (esto desconecta las relaciones con usuarios)
      if (partido.tarjeta) {
        await tx.tarjeta.delete({
          where: { id: partido.tarjeta.id },
        });
      }

      // Luego eliminar el partido
      await tx.partido.delete({
        where: { id: partidoId },
      });
    });

    res.json({ mensaje: "Partido eliminado correctamente" });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el partido" });
  }
});

// Obtener tarjetas donde el usuario está inscrito
app.get("/usuario/:id/tarjetas-inscritas", async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        tarjetasInscritas: { include: { partido: true } },
      },
    });

    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const tarjetas = usuario.tarjetasInscritas.map((t) => ({
      id: t.id,
      cancha: t.partido.cancha,
      lugar: t.partido.lugar,
      dia: t.partido.dia,
      hora: t.partido.hora,
      jugadoresFaltantes: t.partido.jugadoresFaltantes,
    }));

    res.json(tarjetas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener tarjetas inscritas" });
  }
});

app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
