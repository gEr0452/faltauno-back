import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import bcrypt from "bcryptjs";

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
app.use(express.json({ limit: "5mb" }));

// Registrar nuevo usuario
app.post("/auth/register", async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    // Validación de datos
    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ error: "El formato del correo electrónico no es válido" });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (usuarioExistente) {
      return res.status(409).json({ error: "El correo electrónico ya está registrado" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        correo,
        password: hashedPassword,
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        diasDisponibles: true,
        horariosDisponibles: true,
        barriosPreferidos: true,
        imagen: true,
      },
    });

    res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: nuevoUsuario,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Iniciar sesión
app.post("/auth/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Validación de datos
    if (!correo || !password) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    }

    // Buscar el usuario
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar la contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Retornar datos del usuario (sin la contraseña)
    res.json({
      mensaje: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        diasDisponibles: usuario.diasDisponibles,
        horariosDisponibles: usuario.horariosDisponibles,
        barriosPreferidos: usuario.barriosPreferidos,
        imagen: usuario.imagen,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

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
      latitud?: number;
      longitud?: number;
      posicionFaltante?: string;
      fechaHora?: string;
    }

    const {
      cancha,
      lugar,
      dia,
      hora,
      jugadoresFaltantes,
      usuarioId,
      imagen,
      latitud,
      longitud,
      posicionFaltante,
      fechaHora,
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
        latitud: latitud ?? null,
        longitud: longitud ?? null,
        posicionFaltante: posicionFaltante || null,
        fechaHora: fechaHora ? new Date(fechaHora) : null,
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

// Franjas horarias para el filtro "horario" (aproximado, hora es texto libre "HH:MM")
const FRANJAS_HORARIAS: Record<string, string[]> = {
  manana: ["06", "07", "08", "09", "10", "11"],
  tarde: ["12", "13", "14", "15", "16", "17", "18"],
  noche: ["19", "20", "21", "22", "23", "00", "01", "02", "03", "04", "05"],
};

// Obtener todas las tarjetas con su partido y usuarios inscritos
app.get("/tarjetas", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, parseInt(req.query.limit as string) || 10);
    const { lugar, posicion, horario } = req.query;
    const prefijosHorario = horario ? FRANJAS_HORARIAS[String(horario)] : undefined;

    const where: any = {
      partido: {
        ...(lugar ? { lugar: { contains: String(lugar) } } : {}),
        ...(posicion ? { posicionFaltante: { contains: String(posicion) } } : {}),
        ...(prefijosHorario
          ? { OR: prefijosHorario.map((prefijo) => ({ hora: { startsWith: prefijo } })) }
          : {}),
      },
    };

    const [tarjetas, total] = await Promise.all([
      prisma.tarjeta.findMany({
        where,
        include: {
          partido: {
            include: {
              usuario: true
            }
          },
          usuarios: true
        },
        orderBy: { id: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tarjeta.count({ where }),
    ]);

    const tarjetasFormateadas = tarjetas.map((tarjeta) => ({
      id: tarjeta.id,
      nombre: tarjeta.partido.cancha,
      direccion: tarjeta.partido.lugar,
      jugadores: tarjeta.partido.jugadoresFaltantes,
      fecha: `${tarjeta.partido.dia} ${tarjeta.partido.hora}`,
      image: tarjeta.imagen,
      usuario: tarjeta.partido.usuario.nombre,
      usuarioId: tarjeta.partido.usuarioId,
      usuarioImagen: tarjeta.partido.usuario.imagen,
      latitud: tarjeta.partido.latitud,
      longitud: tarjeta.partido.longitud,
      posicionFaltante: tarjeta.partido.posicionFaltante,
      fechaHora: tarjeta.partido.fechaHora,
      inscritos: tarjeta.usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
      })),
    }));

    res.json({ items: tarjetasFormateadas, total, page, pageSize });
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

      // Verificar que el usuario no sea el creador del partido
      if (tarjeta.partido.usuarioId === usuarioIdNumber) {
        throw new HttpError(403, "No puedes inscribirte a un partido que tú creaste");
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
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            imagen: true,
          },
        },
      },
    });

    if (!tarjeta) return res.status(404).json({ error: "Tarjeta no encontrada" });

    // Retornar solo los campos necesarios con el nombre
    const usuariosInscritos = tarjeta.usuarios.map((usuario) => ({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      imagen: usuario.imagen,
    }));
    
    res.json(usuariosInscritos);
  } catch (err) {
    console.error("Error al obtener inscritos:", err);
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
        imagen: true,
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
      select: {
        id: true,
        nombre: true,
        correo: true,
        diasDisponibles: true,
        horariosDisponibles: true,
        barriosPreferidos: true,
        imagen: true,
      },
    });

    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar preferencias" });
  }
});

// Actualizar foto de perfil
app.put("/usuario/:id/imagen", async (req, res) => {
  try {
    const { imagen } = req.body;

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(req.params.id) },
      data: { imagen: imagen || null },
      select: {
        id: true,
        nombre: true,
        correo: true,
        diasDisponibles: true,
        horariosDisponibles: true,
        barriosPreferidos: true,
        imagen: true,
      },
    });

    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar la foto de perfil" });
  }
});

// Obtener partidos creados por el usuario
app.get("/usuario/:id/partidos", async (req, res) => {
  try {
    const partidos = await prisma.partido.findMany({
      where: { usuarioId: parseInt(req.params.id) },
      include: {
        tarjeta: {
          include: {
            usuarios: {
              select: {
                id: true,
                nombre: true,
                imagen: true,
              },
            },
          },
        },
      },
      orderBy: { hora: "desc" },
    });
    res.json(partidos);
  } catch (err) {
    console.error("Error al obtener partidos:", err);
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

      // Eliminar reseñas asociadas antes de borrar el partido (evita violar la FK)
      await tx.resena.deleteMany({ where: { partidoId } });

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
        tarjetasInscritas: { include: { partido: { include: { usuario: true } } } },
      },
    });

    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const tarjetas = usuario.tarjetasInscritas.map((t) => ({
      id: t.id,
      partidoId: t.partidoId,
      cancha: t.partido.cancha,
      lugar: t.partido.lugar,
      dia: t.partido.dia,
      hora: t.partido.hora,
      jugadoresFaltantes: t.partido.jugadoresFaltantes,
      usuario: t.partido.usuario.nombre,
      usuarioId: t.partido.usuarioId,
      fechaHora: t.partido.fechaHora,
    }));

    res.json(tarjetas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener tarjetas inscritas" });
  }
});

// Crear una reseña de un jugador sobre otro, luego de un partido pasado
app.post("/resenas", async (req, res) => {
  try {
    const { autorId, receptorId, partidoId, calificacion, comentario } = req.body;

    const autorIdNum = parseInt(autorId, 10);
    const receptorIdNum = parseInt(receptorId, 10);
    const partidoIdNum = parseInt(partidoId, 10);
    const calificacionNum = parseInt(calificacion, 10);

    if (isNaN(autorIdNum) || isNaN(receptorIdNum) || isNaN(partidoIdNum)) {
      throw new HttpError(400, "Identificadores inválidos");
    }

    if (autorIdNum === receptorIdNum) {
      throw new HttpError(400, "No podés calificarte a vos mismo");
    }

    if (isNaN(calificacionNum) || calificacionNum < 1 || calificacionNum > 5) {
      throw new HttpError(400, "La calificación debe ser un número entre 1 y 5");
    }

    const partido = await prisma.partido.findUnique({
      where: { id: partidoIdNum },
      include: { tarjeta: { include: { usuarios: true } } },
    });

    if (!partido) {
      throw new HttpError(404, "Partido no encontrado");
    }

    if (!partido.fechaHora || partido.fechaHora > new Date()) {
      throw new HttpError(403, "Solo se pueden calificar partidos que ya sucedieron");
    }

    const participantes = new Set<number>([
      partido.usuarioId,
      ...(partido.tarjeta?.usuarios.map((u) => u.id) ?? []),
    ]);

    if (!participantes.has(autorIdNum) || !participantes.has(receptorIdNum)) {
      throw new HttpError(403, "Ambos usuarios deben haber participado de este partido");
    }

    const resena = await prisma.resena.create({
      data: {
        calificacion: calificacionNum,
        comentario: comentario || null,
        autor: { connect: { id: autorIdNum } },
        receptor: { connect: { id: receptorIdNum } },
        partido: { connect: { id: partidoIdNum } },
      },
    });

    res.status(201).json(resena);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    if ((err as any)?.code === "P2002") {
      return res.status(409).json({ error: "Ya calificaste a este usuario para este partido" });
    }
    console.error(err);
    res.status(500).json({ error: "Error al crear la reseña" });
  }
});

// Obtener las reseñas recibidas por un usuario y su promedio
app.get("/usuario/:id/resenas", async (req, res) => {
  try {
    const receptorId = parseInt(req.params.id);

    const resenas = await prisma.resena.findMany({
      where: { receptorId },
      include: {
        autor: { select: { id: true, nombre: true, imagen: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = resenas.length;
    const promedio = total > 0 ? resenas.reduce((suma, r) => suma + r.calificacion, 0) / total : 0;

    res.json({ resenas, promedio, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener las reseñas" });
  }
});

app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
