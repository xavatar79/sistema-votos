// frontend/src/App.js

import React, 'useState', 'useEffect' from 'react';
import io from 'socket.io-client';
import './App.css';

// Obtenemos la URL de la API desde las variables de entorno
const API_URL = import.meta.env.VITE_API_URL;

// Conectamos con el servidor de Socket.IO
const socket = io(API_URL, { withCredentials: true });

function App() {
    const [estado, setEstado] = useState(null);
    const [mesasAgrupadas, setMesasAgrupadas] = useState({});
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [errorLogin, setErrorLogin] = useState('');

    useEffect(() => {
        const cargarEstadoInicial = async () => {
            try {
                const response = await fetch(`${API_URL}/estado`);
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                const data = await response.json();
                procesarEstado(data); // Usamos la función sin ordenamiento
            } catch (error) {
                console.error("Error al cargar estado inicial:", error);
            }
        };

        cargarEstadoInicial();

        socket.on('actualizacion_global', (nuevoEstado) => {
            console.log("Recibida actualización global desde el servidor");
            procesarEstado(nuevoEstado); // Usamos la función sin ordenamiento
        });

        return () => {
            socket.off('actualizacion_global');
        };
    }, []);

    // --- ESTA ES LA LÓGICA ORIGINAL DE AGRUPACIÓN (SIN ORDENAMIENTO) ---
    const procesarEstado = (estadoActual) => {
        setEstado(estadoActual);

        if (estadoActual.mesas && estadoActual.establecimientos) {
            const agrupado = {};

            estadoActual.mesas.forEach(mesa => {
                if (!agrupado[mesa.id_establecimiento]) {
                    agrupado[mesa.id_establecimiento] = [];
                }
                agrupado[mesa.id_establecimiento].push(mesa);
            });
            
            setMesasAgrupadas(agrupado);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setIsAdmin(true);
                setErrorLogin('');
            } else {
                setErrorLogin(data.message || 'Contraseña incorrecta.');
            }
        } catch (error) {
            setErrorLogin('Error de conexión con el servidor.');
            console.error('Error de login:', error);
        }
    };

    // --- RENDERIZADO DEL COMPONENTE ---
    // (Asumo que esta parte de tu código ya está funcionando bien)
    const renderPanelAdmin = () => {
        if (!isAdmin || !estado) return null;

        return (
            <div>
                <h4>Cargar y Modificar Votos</h4>
                <select defaultValue="">
                    <option value="" disabled>-- Seleccionar Mesa --</option>
                    {
                        estado.establecimientos.map(est => (
                            mesasAgrupadas[est.id] && (
                                <optgroup label={est.nombre.toUpperCase()} key={est.id}>
                                    {
                                        mesasAgrupadas[est.id].map(mesa => (
                                            <option key={mesa.id} value={mesa.id}>
                                                Mesa: {mesa.numero}
                                            </option>
                                        ))
                                    }
                                </optgroup>
                            )
                        ))
                    }
                </select>
                {/* ... El resto de tu formulario de carga de votos ... */}
            </div>
        );
    };

    return (
        <div className="App">
            {/* ... Tu JSX principal ... */}
            {!isAdmin ? (
                <form onSubmit={handleLogin}>
                    <h3>Acceso al Panel de Administración</h3>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña"
                    />
                    <button type="submit">Entrar</button>
                    {errorLogin && <p style={{ color: 'red' }}>{errorLogin}</p>}
                </form>
            ) : (
                renderPanelAdmin()
            )}
        </div>
    );
}

export default App;