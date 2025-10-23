import express from "express";
import { PrismaClient } from "./generated/prisma/client.js";
import cors from "cors";

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
      include: { usuario: true },
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
    });
    res.json(tarjetas);
        const tarjetasFormateadas = tarjetas.map(tarjeta => ({
      id: tarjeta.id,
      nombre: tarjeta.partido.cancha,
      direccion: tarjeta.partido.lugar,
      jugadores: tarjeta.partido.jugadoresFaltantes,
      fecha: `${tarjeta.partido.dia} ${tarjeta.partido.hora}`,
      image: tarjeta.imagen, 
      usuario: `Usuario ${tarjeta.partido.usuarioId}`,
      inscritos: tarjeta.usuarios
    }));
    
    res.json(tarjetasFormateadas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener tarjetas" });
  }
});

// Inscribir usuario en una tarjeta
app.post("/tarjetas/:id/inscribir", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;

    const tarjeta = await prisma.tarjeta.update({
      where: { id: parseInt(id) },
      data: {
        usuarios: { connect: { id: parseInt(usuarioId) } },
      },
      include: { usuarios: true },
    });

    res.json(tarjeta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al inscribir usuario en tarjeta" });
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
