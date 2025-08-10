const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

// --- CONFIGURACIÓN DE LA BASE DE DATOS (MongoDB Atlas) ---
const MONGO_URI = "mongodb+srv://<db_username>:<db_password>@cluster0.yi3mf87.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado a MongoDB Atlas!"))
    .catch(err => console.error("Error al conectar a MongoDB:", err));

// Definir los "modelos" de datos
const Partido = mongoose.model('Partido', new mongoose.Schema({ id: String, nombre: String }));
const Establecimiento = mongoose.model('Establecimiento', new mongoose.Schema({ id: String, nombre: String, direccion: String }));
const Mesa = mongoose.model('Mesa', new mongoose.Schema({ id: String, numero: String, id_establecimiento: String }));
const Resultado = mongoose.model('Resultado', new mongoose.Schema({ id: String, id_mesa: String, id_partido: String, cantidad_votos: Number, esDudosa: Boolean }));

// --- CONFIGURACIÓN DEL SERVIDOR ---
const app = express();
app.use(cors({ origin: "https://sistema-votos-five.vercel.app" }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "https://sistema-votos-five.vercel.app", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = "LLA_AVELLANEDA_2025";

// --- FUNCIÓN DE ACTUALIZACIÓN GLOBAL ---
const actualizarResultadosGlobal = async () => {
    const state = {
        partidos: await Partido.find(),
        establecimientos: await Establecimiento.find(),
        mesas: await Mesa.find(),
        resultados: await Resultado.find()
    };
    io.emit('actualizacion_global', state);
    console.log('Estado global actualizado y enviado a los clientes.');
};

// ... (El resto de tus rutas adaptadas para Mongoose) ...
// Aquí te dejo las rutas adaptadas:

// 1. AUTENTICACIÓN (sin cambios)
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.status(200).json({ success: true, message: 'Autenticación exitosa' });
  } else {
    res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
  }
});

// 2. OBTENER TODO EL ESTADO INICIAL
app.get('/api/estado', async (req, res) => {
    const state = {
        partidos: await Partido.find(),
        establecimientos: await Establecimiento.find(),
        mesas: await Mesa.find(),
        resultados: await Resultado.find()
    };
    res.json(state);
});

// 3. CRUD - PARTIDOS POLÍTICOS
app.post('/api/partidos', async (req, res) => {
  const nuevoPartido = new Partido({ id: nanoid(), ...req.body });
  await nuevoPartido.save();
  actualizarResultadosGlobal();
  res.status(201).json(nuevoPartido);
});

// 4. CRUD - ESTABLECIMIENTOS
app.post('/api/establecimientos', async (req, res) => {
  const nuevoEst = new Establecimiento({ id: nanoid(), ...req.body });
  await nuevoEst.save();
  actualizarResultadosGlobal();
  res.status(201).json(nuevoEst);
});

// 5. CRUD - MESAS
app.post('/api/mesas', async (req, res) => {
  const nuevaMesa = new Mesa({ id: nanoid(), ...req.body });
  await nuevaMesa.save();
  actualizarResultadosGlobal();
  res.status(201).json(nuevaMesa);
});

// 6. CARGA DE VOTOS
app.post('/api/cargar-votos', async (req, res) => {
  const { id_mesa, votos, esDudosa } = req.body;
  await Resultado.deleteMany({ id_mesa: id_mesa });
  const nuevosResultados = votos.map(voto => ({
    id: nanoid(),
    id_mesa: id_mesa,
    id_partido: voto.id_partido,
    cantidad_votos: parseInt(voto.cantidad) || 0,
    esDudosa: esDudosa
  }));
  await Resultado.insertMany(nuevosResultados);
  actualizarResultadosGlobal();
  res.status(201).json({ message: 'Resultados cargados con éxito' });
});

io.on('connection', (socket) => {
  console.log(`Un usuario se ha conectado: ${socket.id}`);
  actualizarResultadosGlobal(); // Enviar estado al conectar
  socket.on('disconnect', () => {
    console.log(`El usuario se ha desconectado: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});