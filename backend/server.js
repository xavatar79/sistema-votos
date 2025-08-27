// C:\sistema-votos\backend\server.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

// --- CONFIGURACIÓN DE SECRETOS Y VARIABLES DE ENTORNO ---
const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://sistema-votos-beta.vercel.app";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "LLA_AVELLANEDA_2025";
const PORT = process.env.PORT || 4000;

// --- Verificación de Seguridad Crítica ---
if (!MONGO_URI) {
    console.error("\nFATAL ERROR: La variable de entorno MONGO_URI no está definida. La aplicación no puede iniciarse.\n");
    process.exit(1);
}

// --- MODELOS DE DATOS ---
const Partido = mongoose.model('Partido', new mongoose.Schema({ id: String, nombre: String }));
const Establecimiento = mongoose.model('Establecimiento', new mongoose.Schema({ id: String, nombre: String, direccion: String }));
const Mesa = mongoose.model('Mesa', new mongoose.Schema({ id: String, numero: String, id_establecimiento: String }));
const Resultado = mongoose.model('Resultado', new mongoose.Schema({ id: String, id_mesa: String, id_partido: String, cantidad_votos: Number, esDudosa: Boolean }));

// --- FUNCIÓN PRINCIPAL DE ARRANQUE ---
async function startServer() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Conectado a MongoDB Atlas!");

        const app = express();
        const server = http.createServer(app);

        // --- CONFIGURACIÓN DE CORS (LA SOLUCIÓN) ---
        // Se aplica a TODAS las peticiones que lleguen a Express y Socket.IO
        const corsOptions = {
            origin: FRONTEND_URL,
            methods: ["GET", "POST", "PUT", "DELETE"], // Permitir todos los métodos comunes
            credentials: true // Permitir que el frontend envíe cookies
        };

        app.use(cors(corsOptions));
        app.use(express.json());

        const io = new Server(server, {
            cors: corsOptions // Reutilizamos la misma configuración de CORS para Socket.IO
        });
        
        // ... (El resto del código, como las rutas y la lógica de sockets, permanece igual)
        // He omitido el resto para ser breve, pero asegúrate de que esté allí.

        server.listen(PORT, () => {
          console.log(`Servidor corriendo en el puerto ${PORT}`);
        });

    } catch (error) {
        console.error("No se pudo iniciar el servidor:", error);
        process.exit(1);
    }
}

// (Asegúrate de tener tu función setupRoutes y su llamado aquí)
function setupRoutes(app, actualizarResultadosGlobal) {
    // ... tu código de rutas ...
}

startServer();