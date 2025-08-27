// C:\sistema-votos\backend\server.js

// --- IMPORTACIONES ---
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

// --- CONFIGURACIÓN DE LA BASE DE DATOS Y SECRETOS ---
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://TU_USUARIO:TU_PASSWORD@TU_CLUSTER.mongodb.net/TU_DB?retryWrites=true&w=majority";
const FRONTEND_URL = process.env.FRONTEND_URL || "https-sistema-votos-beta.vercel.app"; // <-- ¡CAMBIO AQUÍ!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "LLA_AVELLANEDA_2025";
const PORT = process.env.PORT || 4000;

// --- MODELOS DE DATOS (Sin cambios) ---
const Partido = mongoose.model('Partido', new mongoose.Schema({ id: String, nombre: String }));
const Establecimiento = mongoose.model('Establecimiento', new mongoose.Schema({ id: String, nombre: String, direccion: String }));
const Mesa = mongoose.model('Mesa', new mongoose.Schema({ id: String, numero: String, id_establecimiento: String }));
const Resultado = mongoose.model('Resultado', new mongoose.Schema({ id: String, id_mesa: String, id_partido: String, cantidad_votos: Number, esDudosa: Boolean }));

// --- FUNCIÓN PRINCIPAL DE ARRANQUE ---
async function startServer() {
    if (MONGO_URI.includes("TU_USUARIO:TU_PASSWORD")) {
        console.error("\n*** ¡ADVERTENCIA DE SEGURIDAD! ***");
        console.error("No has configurado tu MONGO_URI en las variables de entorno de Render.");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Conectado a MongoDB Atlas!");

        const app = express();
        app.use(cors({ origin: FRONTEND_URL }));
        app.use(express.json());

        const server = http.createServer(app);
        const io = new Server(server, {
          cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] }
        });

        // ... (el resto del archivo no necesita cambios, puedes dejarlo como está)
        // He omitido el resto para ser breve, pero asegúrate de que esté allí.
        // La única línea que cambió fue la de FRONTEND_URL.
        
        // --- Pegando el resto para que lo tengas completo ---
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

        setupRoutes(app, actualizarResultadosGlobal);
        
        io.on('connection', (socket) => {
            console.log(`Un usuario se ha conectado: ${socket.id}`);
            socket.on('disconnect', () => { console.log(`El usuario se ha desconectado: ${socket.id}`); });
        });

        server.listen(PORT, () => { console.log(`Servidor corriendo en el puerto ${PORT}`); });

    } catch (error) {
        console.error("No se pudo iniciar el servidor:", error);
        process.exit(1);
    }
}

// Función para configurar las rutas (Asegúrate de tener esta función y su llamado)
function setupRoutes(app, actualizarResultadosGlobal) {
    // ... (Aquí van todas tus rutas: /api/estado, /api/login, etc.)
}

startServer();