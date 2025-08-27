// C:\sistema-votos\backend\server.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

// --- CONFIGURACIÓN DE VARIABLES DE ENTORNO ---
const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://sistema-votos-beta.vercel.app";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "LLA_AVELLANEDA_2025";
const PORT = process.env.PORT || 4000;

// Verificación Crítica de Seguridad
if (!MONGO_URI) {
    console.error("\nFATAL ERROR: MONGO_URI no está definida en las variables de entorno.\n");
    process.exit(1);
}

// --- MODELOS DE DATOS ---
const Partido = mongoose.model('Partido', new mongoose.Schema({ id: String, nombre: String }));
const Establecimiento = mongoose.model('Establecimiento', new mongoose.Schema({ id: String, nombre: String, direccion: String }));
const Mesa = mongoose.model('Mesa', new mongoose.Schema({ id: String, numero: String, id_establecimiento: String }));
const Resultado = mongoose.model('Resultado', new mongoose.Schema({ id: String, id_mesa: String, id_partido: String, cantidad_votos: Number, esDudosa: Boolean }));

// --- FUNCIÓN PRINCIPAL ---
async function startServer() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Conectado a MongoDB Atlas!");

        const app = express();
        const server = http.createServer(app);

        // --- Configuración de CORS ---
        const corsOptions = {
            origin: FRONTEND_URL,
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        };
        app.use(cors(corsOptions));
        app.use(express.json());

        // --- Configuración de Socket.IO ---
        const io = new Server(server, { cors: corsOptions });

        const actualizarResultadosGlobal = async () => {
            try {
                const state = {
                    partidos: await Partido.find({}),
                    establecimientos: await Establecimiento.find({}),
                    mesas: await Mesa.find({}),
                    resultados: await Resultado.find({})
                };
                io.emit('actualizacion_global', state);
            } catch (error) { console.error("Error al actualizar estado global:", error); }
        };

        // --- DEFINICIÓN DE RUTAS DE LA API ---
        
        // RUTA PARA OBTENER TODO EL ESTADO
        app.get('/api/estado', async (req, res) => {
            try {
                const state = {
                    partidos: await Partido.find({}),
                    establecimientos: await Establecimiento.find({}),
                    mesas: await Mesa.find({}),
                    resultados: await Resultado.find({})
                };
                res.status(200).json(state);
            } catch (error) {
                res.status(500).json({ message: "Error al obtener el estado" });
            }
        });

        // RUTA DE LOGIN
        app.post('/api/login', (req, res) => {
            const { password } = req.body;
            if (password === ADMIN_PASSWORD) {
                res.status(200).json({ success: true, message: 'Autenticación exitosa' });
            } else {
                res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
            }
        });

        // RUTA PARA CARGAR VOTOS
        app.post('/api/cargar-votos', async (req, res) => {
            const { id_mesa, votos, esDudosa } = req.body;
            await Resultado.deleteMany({ id_mesa: id_mesa });
            if (votos && votos.length > 0) {
                const nuevosResultados = votos.map(voto => ({
                    id: nanoid(), id_mesa, id_partido: voto.id_partido,
                    cantidad_votos: parseInt(voto.cantidad) || 0,
                    esDudosa: esDudosa
                }));
                await Resultado.insertMany(nuevosResultados);
            }
            actualizarResultadosGlobal();
            res.status(201).json({ message: 'Resultados cargados con éxito' });
        });

        // ... Aquí irían tus otras rutas (CRUD de Partidos, Mesas, etc.)
        // Añádelas si las necesitas. Por ahora, nos aseguramos de que las principales funcionen.
        

        // --- LÓGICA DE WEBSOCKETS ---
        io.on('connection', (socket) => {
            console.log(`Un usuario se ha conectado: ${socket.id}`);
            socket.on('disconnect', () => { console.log(`El usuario se ha desconectado: ${socket.id}`); });
        });

        // --- INICIO DEL SERVIDOR ---
        server.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });

    } catch (error) {
        console.error("No se pudo iniciar el servidor:", error);
        process.exit(1);
    }
}

// ¡Llamamos a la función para que todo empiece!
startServer();