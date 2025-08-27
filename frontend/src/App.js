// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Obtenemos la URL de la API desde las variables de entorno
const API_URL = import.meta.env.VITE_API_URL; // <-- CAMBIO

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
                // --- CAMBIO: Usamos fetch directamente ---
                const response = await fetch(`${API_URL}/estado`);
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                const data = await response.json();
                procesarYOrdenarEstado(data);
                // --- FIN DEL CAMBIO ---

            } catch (error) {
                console.error("Error al cargar estado inicial:", error);
            }
        };

        cargarEstadoInicial();

        socket.on('actualizacion_global', (nuevoEstado) => {
            console.log("Recibida actualización global desde el servidor");
            procesarYOrdenarEstado(nuevoEstado);
        });

        return () => {
            socket.off('actualizacion_global');
        };
    }, []);

    // --- ¡AQUÍ ESTÁ LA LÓGICA CLAVE! ---
    const procesarYOrdenarEstado = (estadoActual) => {
        setEstado(estadoActual);

        if (estadoActual.mesas && estadoActual.establecimientos) {
            const agrupado = {};

            estadoActual.mesas.forEach(mesa => {
                if (!agrupado[mesa.id_establecimiento]) {
                    agrupado[mesa.id_establecimiento] = [];
                }
                agrupado[mesa.id_establecimiento].push(mesa);
            });

            // ¡LA SOLUCIÓN! Ordenamos las mesas DENTRO de cada grupo
            for (const idEstablecimiento in agrupado) {
                agrupado[idEstablecimiento].sort((a, b) => {
                    return parseInt(a.numero) - parseInt(b.numero);
                });
            }
            
            setMesasAgrupadas(agrupado);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // --- CAMBIO: Usamos fetch para el login ---
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
            // --- FIN DEL CAMBIO ---

        } catch (error) {
            setErrorLogin('Error de conexión con el servidor.');
            console.error('Error de login:', error);
        }
    };

    // ... (El resto del JSX para renderizar el componente es exactamente el mismo que antes)
    
    // Lo pego aquí para que tengas el archivo completo:
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
            </div>
        );
    };

    return (
        <div className="App">
            {/* ... Aquí va tu JSX principal ... */}
            {/* Por ejemplo, el formulario de login */}
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