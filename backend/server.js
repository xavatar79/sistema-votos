const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

// --- CONFIGURACIÓN DE LA BASE DE DATOS (MongoDB Atlas) ---
// Es mucho más seguro poner esto en las "Environment Variables" de Render
// En el panel de Render -> Environment -> Add Environment Variable:
// Key: MONGO_URI
// Value: Tu cadena de conexión
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://<db_username>:<db_password>@cluster0.yi3mf87.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
        app.use(cors({ origin: "https://sistema-votos-five.vercel.app" }));
        app.use(express.json());

        const server = http.createServer(app);
        const io = new Server(server, {
          cors: { origin: "https://sistema-votos-five.vercel.app", methods: ["GET", "POST"] }
        });

        const PORT = process.env.PORT || 4000;
        const ADMIN_PASSWORD = "LLA_AVELLANEDA_2025";

        const actualizarResultadosGlobal = async () => {
            try {
                const state = {
                    partidos: await Partido.find({}),
                    establecimientos: await Establecimiento.find({}),
                    mesas: await Mesa.find({}),
                    resultados: await Resultado.find({})
                };
                io.emit('actualizacion_global', state);
                console.log('Estado global actualizado y enviado a los clientes.');
            } catch (error) {
                console.error("Error al actualizar estado global:", error);
            }
        };

        // --- RUTAS DE LA API ---

        // ESTADO INICIAL
        app.get('/api/estado', async (req, res) => {
            try {
                const state = {
                    partidos: await Partido.find({}),
                    establecimientos: await Establecimiento.find({}),
                    mesas: await Mesa.find({}),
                    resultados: await Resultado.find({})
                };
                res.json(state);
            } catch (error) {
                res.status(500).json({ message: "Error al obtener el estado" });
            }
        });

        // LOGIN
        app.post('/api/login', (req, res) => {
            const { password } = req.body;
            if (password === ADMIN_PASSWORD) {
              res.status(200).json({ success: true, message: 'Autenticación exitosa' });
            } else {
              res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
            }
        });

        // CREAR PARTIDO
        app.post('/api/partidos', async (req, res) => {
            const nuevoPartido = new Partido({ id: nanoid(), ...req.body });
            await nuevoPartido.save();
            actualizarResultadosGlobal();
            res.status(201).json(nuevoPartido);
        });
        
        // BORRAR PARTIDO
        app.delete('/api/partidos/:id', async (req, res) => {
            await Partido.deleteOne({ id: req.params.id });
            actualizarResultadosGlobal();
            res.status(200).json({ message: 'Partido eliminado' });
        });

        // CREAR ESTABLECIMIENTO
        app.post('/api/establecimientos', async (req, res) => {
            const nuevoEst = new Establecimiento({ id: nanoid(), ...req.body });
            await nuevoEst.save();
            actualizarResultadosGlobal();
            res.status(201).json(nuevoEst);
        });

        // BORRAR ESTABLECIMIENTO
        app.delete('/api/establecimientos/:id', async (req, res) => {
            await Establecimiento.deleteOne({ id: req.params.id });
            actualizarResultadosGlobal();
            res.status(200).json({ message: 'Establecimiento eliminado' });
        });

        // CREAR MESA
        app.post('/api/mesas', async (req, res) => {
            const nuevaMesa = new Mesa({ id: nanoid(), ...req.body });
            await nuevaMesa.save();
            actualizarResultadosGlobal();
            res.status(201).json(nuevaMesa);
        });

        // BORRAR MESA
        app.delete('/api/mesas/:id', async (req, res) => {
            await Mesa.deleteOne({ id: req.params.id });
            await Resultado.deleteMany({ id_mesa: req.params.id }); // Borra votos asociados
            actualizarResultadosGlobal();
            res.status(200).json({ message: 'Mesa eliminada' });
        });

        // CARGAR VOTOS
        app.post('/api/cargar-votos', async (req, res) => {
            const { id_mesa, votos, esDudosa } = req.body;
            await Resultado.deleteMany({ id_mesa: id_mesa });
            if (votos && votos.length > 0) {
                const nuevosResultados = votos.map(voto => ({
                    id: nanoid(),
                    id_mesa: id_mesa,
                    id_partido: voto.id_partido,
                    cantidad_votos: parseInt(voto.cantidad) || 0,
                    esDudosa: esDudosa
                }));
                await Resultado.insertMany(nuevosResultados);
            }
            actualizarResultadosGlobal();
            res.status(201).json({ message: 'Resultados cargados con éxito' });
        });

        // --- LÓGICA DE WEBSOCKETS ---
        io.on('connection', (socket) => {
            console.log(`Un usuario se ha conectado: ${socket.id}`);
            // No enviar estado al conectar, el frontend lo pide vía /api/estado
            socket.on('disconnect', () => {
              console.log(`El usuario se ha desconectado: ${socket.id}`);
            });
        });

        server.listen(PORT, () => {
          console.log(`Servidor corriendo en el puerto ${PORT}`);
        });

    } catch (error) {
        console.error("No se pudo iniciar el servidor:", error);
        process.exit(1);
    }
}

startServer(); // Ejecutar la función principal