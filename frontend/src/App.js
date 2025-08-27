import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css'; 

// Registrar componentes y conectar al socket
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
// ¡IMPORTANTE! Esta URL debe ser la de tu backend en Render
const SOCKET_URL = 'https://servidor-votos-avellaneda.onrender.com';
const socket = io(SOCKET_URL);

// --- COMPONENTES DE GESTIÓN DEL ADMIN PANEL ---

const GestionPartidos = ({ partidos, onAdd, onDelete }) => {
    const [nombre, setNombre] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (nombre) {
            onAdd({ nombre });
            setNombre('');
        }
    };
    return (
        <div className="gestion-section">
            <ul>
                {partidos.map(p => <li key={p.id}><span>{p.nombre}</span><button onClick={() => onDelete(p.id)} className="delete-btn">X</button></li>)}
            </ul>
            <form onSubmit={handleSubmit}>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nuevo Partido" required />
                <button type="submit">Agregar</button>
            </form>
        </div>
    );
};

const GestionEstablecimientos = ({ establecimientos, onAdd, onDelete }) => {
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (nombre && direccion) {
            onAdd({ nombre, direccion });
            setNombre('');
            setDireccion('');
        }
    };
    return (
        <div className="gestion-section">
            <ul>
                {establecimientos.map(e => <li key={e.id}><span>{e.nombre}</span><button onClick={() => onDelete(e.id)} className="delete-btn">X</button></li>)}
            </ul>
            <form onSubmit={handleSubmit}>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre Escuela" required />
                <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Dirección" required />
                <button type="submit">Agregar</button>
            </form>
        </div>
    );
};

const GestionMesas = ({ mesas, establecimientos, onAdd, onDelete }) => {
    const [numero, setNumero] = useState('');
    const [idEstablecimiento, setIdEstablecimiento] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (numero && idEstablecimiento) {
            onAdd({ numero, id_establecimiento: idEstablecimiento });
            setNumero('');
            setIdEstablecimiento('');
        }
    };
    return (
        <div className="gestion-section">
            <ul>
                {mesas.map(m => {
                    const est = establecimientos.find(e => e.id === m.id_establecimiento);
                    return <li key={m.id}><span>Mesa: {m.numero} ({est ? est.nombre : 'N/A'})</span><button onClick={() => onDelete(m.id)} className="delete-btn">X</button></li>
                })}
            </ul>
            <form onSubmit={handleSubmit}>
                <select value={idEstablecimiento} onChange={e => setIdEstablecimiento(e.target.value)} required>
                    <option value="">Seleccionar Establecimiento</option>
                    {establecimientos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                <input type="text" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Número de Mesa" required />
                <button type="submit">Agregar</button>
            </form>
        </div>
    );
};

const CargaVotos = ({ data, partidos, mesas, establecimientos, onCargar }) => {
    const [idMesa, setIdMesa] = useState('');
    const [votos, setVotos] = useState({});
    const [esDudosa, setEsDudosa] = useState(false);
    const [mesaTieneVotos, setMesaTieneVotos] = useState(false);
    const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');

    const { mesasCargadas, mesasPendientes } = useMemo(() => {
        if (!mesas || !data.resultados) {
            return { mesasCargadas: [], mesasPendientes: [] };
        }
        const idsMesasCargadas = new Set(data.resultados.map(r => r.id_mesa));
        const cargadas = [];
        const pendientes = [];
        mesas.forEach(mesa => {
            if (idsMesasCargadas.has(mesa.id)) {
                cargadas.push(mesa);
            } else {
                pendientes.push(mesa);
            }
        });
        return { mesasCargadas: cargadas, mesasPendientes: pendientes };
    }, [mesas, data.resultados]);
    
    useEffect(() => {
        setMensajeConfirmacion('');

        if (!idMesa) {
            const initialState = {};
            partidos.forEach(p => { initialState[p.id] = ''; });
            setVotos(initialState);
            setEsDudosa(false);
            setMesaTieneVotos(false);
            return;
        }

        const resultadosDeLaMesa = data.resultados?.filter(r => r.id_mesa === idMesa) || [];
        setMesaTieneVotos(resultadosDeLaMesa.length > 0);

        if (resultadosDeLaMesa.length > 0) {
            const votosCargados = {};
            resultadosDeLaMesa.forEach(res => {
                votosCargados[res.id_partido] = res.cantidad_votos;
            });
            setVotos(votosCargados);
            setEsDudosa(resultadosDeLaMesa[0].esDudosa);
        } else {
            const initialState = {};
            partidos.forEach(p => { initialState[p.id] = ''; });
            setVotos(initialState);
            setEsDudosa(false);
        }
    }, [idMesa, data.resultados, partidos]);

    const handleVoteChange = (id_partido, cantidad) => {
        if (cantidad === '' || /^[0-9\b]+$/.test(cantidad)) {
            setVotos(prev => ({...prev, [id_partido]: cantidad}));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!idMesa) return;
        const votosPayload = Object.entries(votos).map(([id_partido, cantidad]) => ({
            id_partido,
            cantidad: parseInt(cantidad) || 0
        }));
        
        await onCargar({ id_mesa: idMesa, votos: votosPayload, esDudosa });

        setMensajeConfirmacion('¡Cambios guardados con éxito!');
        setTimeout(() => {
            setMensajeConfirmacion('');
        }, 3000);
    };

    const handleBorrarVotos = () => {
        if (window.confirm(`¿Estás seguro de que quieres borrar TODOS los votos de la mesa seleccionada? La mesa volverá a la lista de pendientes.`)) {
            onCargar({ id_mesa: idMesa, votos: [], esDudosa: false });
            setIdMesa('');
        }
    };

    return (
        <div className="gestion-section carga-votos">
            <form onSubmit={handleSubmit}>
                <label htmlFor="mesas-pendientes">1. Seleccionar Mesa para Cargar Votos:</label>
                <select id="mesas-pendientes" value={idMesa} onChange={e => setIdMesa(e.target.value)}>
                    <option value="">-- Quedan {mesasPendientes.length} mesas por cargar --</option>
                    {mesasPendientes.sort((a, b) => parseInt(a.numero) - parseInt(b.numero)).map(m => {
                        const est = establecimientos.find(e => e.id === m.id_establecimiento);
                        return <option key={m.id} value={m.id}>Mesa: {m.numero} ({est ? est.nombre : 'S/E'})</option>;
                    })}
                </select>

                <label htmlFor="mesas-cargadas">2. O seleccionar una Mesa ya Cargada para Editar:</label>
                <select id="mesas-cargadas" value={idMesa} onChange={e => setIdMesa(e.target.value)}>
                    <option value="">-- Hay {mesasCargadas.length} mesas cargadas --</option>
                    {mesasCargadas.sort((a, b) => parseInt(a.numero) - parseInt(b.numero)).map(m => {
                        const est = establecimientos.find(e => e.id === m.id_establecimiento);
                        return <option key={m.id} value={m.id}>Mesa: {m.numero} ({est ? est.nombre : 'S/E'})</option>;
                    })}
                </select>

                {mensajeConfirmacion && <p className="mensaje-confirmacion">{mensajeConfirmacion}</p>}

                {idMesa && (
                    <>
                        <div className="votos-inputs">
                            {partidos.map(p => (
                                <div key={p.id}>
                                    <label>{p.nombre}</label>
                                    <input 
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={votos[p.id] || ''} 
                                        onChange={e => handleVoteChange(p.id, e.target.value)} 
                                        placeholder="Votos" 
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="checkbox-dudosa">
                            <input type="checkbox" id="dudosa" checked={esDudosa} onChange={e => setEsDudosa(e.target.checked)} />
                            <label htmlFor="dudosa">Marcar como Mesa Dudosa ⚠️</label>
                        </div>
                        <div className="form-actions">
                            <button type="submit">Guardar Votos de la Mesa</button>
                            {mesaTieneVotos && (
                                <button type="button" onClick={handleBorrarVotos} className="borrar-votos-btn">
                                    Borrar Votos y Mover a Pendientes
                                </button>
                            )}
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};

const AdminPanel = ({ data, onLogout }) => {
    const handleApiCall = async (endpoint, method, body = null) => {
        try {
            const options = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) options.body = JSON.stringify(body);
            const response = await fetch(`${SOCKET_URL}${endpoint}`, options);
            if (!response.ok) throw new Error('Falló la petición a la API');
        } catch (error) { console.error("Error en API:", error); }
    };
    return (
        <div className="admin-panel">
            <h2>Panel de Control</h2>
            <button onClick={onLogout} className="logout-button">Cerrar Sesión</button>
            <div className="admin-sections">
                <details className="admin-details">
                    <summary className="admin-summary">Gestionar Partidos Políticos</summary>
                    <GestionPartidos 
                        partidos={data.partidos || []} 
                        onAdd={(body) => handleApiCall('/api/partidos', 'POST', body)} 
                        onDelete={(id) => handleApiCall(`/api/partidos/${id}`, 'DELETE')} 
                    />
                </details>

                <details className="admin-details">
                    <summary className="admin-summary">Gestionar Establecimientos</summary>
                    <GestionEstablecimientos 
                        establecimientos={data.establecimientos || []} 
                        onAdd={(body) => handleApiCall('/api/establecimientos', 'POST', body)} 
                        onDelete={(id) => handleApiCall(`/api/establecimientos/${id}`, 'DELETE')} 
                    />
                </details>

                <details className="admin-details">
                    <summary className="admin-summary">Gestionar Mesas</summary>
                    <GestionMesas 
                        mesas={data.mesas || []} 
                        establecimientos={data.establecimientos || []} 
                        onAdd={(body) => handleApiCall('/api/mesas', 'POST', body)} 
                        onDelete={(id) => handleApiCall(`/api/mesas/${id}`, 'DELETE')} 
                    />
                </details>

                <details className="admin-details" open>
                    <summary className="admin-summary">Cargar y Modificar Votos</summary>
                    <CargaVotos 
                        data={data} 
                        partidos={data.partidos || []} 
                        mesas={data.mesas || []} 
                        establecimientos={data.establecimientos || []} 
                        onCargar={(body) => handleApiCall('/api/cargar-votos', 'POST', body)} 
                    />
                </details>
            </div>
        </div>
    );
};

const LoginScreen = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleLogin = async () => {
        try {
            const response = await fetch(`${SOCKET_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
            if (response.ok) { onLogin(); } else { setError('Contraseña incorrecta'); }
        } catch (err) { setError('No se pudo conectar al servidor'); }
    };
    return (
        <div className="login-container">
            <h2>Acceso al Panel de Administración</h2>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" onKeyPress={e => e.key === 'Enter' && handleLogin()} />
            <button onClick={handleLogin}>Entrar</button>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

const TotalsTable = ({ totals }) => {
    const sortedTotals = Object.entries(totals).sort(([, a], [, b]) => b - a);
    return (
        <div className="totals-container">
            <h3>Votos Totales por Partido</h3>
            <table className="totals-table">
                <thead>
                    <tr>
                        <th>Partido</th>
                        <th>Total de Votos</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTotals.map(([partido, votos]) => (
                        <tr key={partido}>
                            <td>{partido}</td>
                            <td>{votos.toLocaleString('es-AR')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PublicDashboard = ({ data }) => {
    const [filtroEst, setFiltroEst] = useState('todos');
    const [filtroMesa, setFiltroMesa] = useState('todos');

    const calculatedData = useMemo(() => {
        if (!data.resultados || !data.partidos) {
            return { chartData: { labels: [], datasets: [] }, totals: {} };
        }

        const coloresPorPartido = {
            "ALIANZA LA LIBERTAD AVANZA": "#7D22A8",
            "PARTIDO LIBERTARIO": "#FFD700",
            "ALIANZA UNION Y LIBERTAD": "#2ecc71",
            "MOVIMIENTO AVANZADA SOCIALISTA": "#e74c3c",
            "ALIANZA SOMOS BUENOS AIRES": "#3498db",
            "PARTIDO FRENTE PATRIOTA FEDERAL": "#f1c40f",
            "PARTIDO POLITICA OBRERA": "#e67e22",
            "ALIANZA POTENCIA": "#1abc9c",
            "ALIANZA NUEVOS AIRES": "#9b59b6",
            // Asegúrate de que los nombres de los partidos aquí
            // sean EXACTAMENTE iguales a como están en tu base de datos.
        };

        let resultadosAMostrar = data.resultados;
        if (filtroEst !== 'todos') {
            const mesasDelEstablecimiento = data.mesas.filter(m => m.id_establecimiento === filtroEst).map(m => m.id);
            resultadosAMostrar = resultadosAMostrar.filter(r => mesasDelEstablecimiento.includes(r.id_mesa));
        }
        if (filtroMesa !== 'todos') {
            resultadosAMostrar = resultadosAMostrar.filter(r => r.id_mesa === filtroMesa);
        }
        
        const votosPorPartido = {};
        resultadosAMostrar.forEach(res => {
            const partido = data.partidos.find(p => p.id === res.id_partido);
            if (partido) {
                votosPorPartido[partido.nombre] = (votosPorPartido[partido.nombre] || 0) + res.cantidad_votos;
            }
        });
        
        const sortedTotals = Object.entries(votosPorPartido).sort(([, a], [, b]) => b - a);

        const coloresDeBarras = sortedTotals.map(([nombrePartido, _]) => {
            return coloresPorPartido[nombrePartido] || '#36A2EB'; // Color por defecto si no se encuentra
        });

        const chartData = {
            labels: sortedTotals.map(item => item[0]),
            datasets: [{ 
                label: 'Votos', 
                data: sortedTotals.map(item => item[1]), 
                backgroundColor: coloresDeBarras
            }],
        };

        return { chartData, totals: votosPorPartido };

    }, [data, filtroEst, filtroMesa]);

    const handleExportExcel = () => {
        const dataToExport = Object.entries(calculatedData.totals).map(([partido, votos]) => ({ 'Partido Político': partido, 'Cantidad de Votos': votos }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");
        XLSX.writeFile(workbook, "ResultadosElectorales.xlsx");
    };

    if (!data.partidos || data.partidos.length === 0) return <p>Esperando datos del servidor...</p>;

    return (
        <div className="public-dashboard">
            <h1>Resultados Electorales - La Libertad Avanza Avellaneda</h1>
            <div className="filtros">
                <select value={filtroEst} onChange={e => { setFiltroEst(e.target.value); setFiltroMesa('todos'); }}>
                    <option value="todos">Todos los Establecimientos</option>
                    {(data.establecimientos || []).map(est => <option key={est.id} value={est.id}>{est.nombre}</option>)}
                </select>
                <select value={filtroMesa} onChange={e => setFiltroMesa(e.target.value)} disabled={filtroEst === 'todos'}>
                    <option value="todos">Todas las Mesas</option>
                    {(data.mesas || []).filter(m => m.id_establecimiento === filtroEst).map(mesa => <option key={mesa.id} value={mesa.id}>{mesa.numero}</option>)}
                </select>
            </div>
            <div className="dashboard-content">
                <div className="grafico-container">
                    <Bar data={calculatedData.chartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Votos por Partido Político' }}}} />
                </div>
                <TotalsTable totals={calculatedData.totals} />
            </div>
            
            <button onClick={handleExportExcel} className="export-button">Exportar Resultados a Excel</button>
            
            <h3 style={{marginTop: '3rem'}}>Detalle Completo de Votos por Mesa</h3>
            <table className="results-table">
                <thead><tr><th>Establecimiento</th><th>Mesa</th><th>Partido</th><th>Votos</th></tr></thead>
                <tbody>
                    {data.resultados && data.partidos && data.mesas && data.establecimientos && data.resultados.map(res => {
                        const mesa = data.mesas.find(m => m.id === res.id_mesa);
                        const est = mesa ? data.establecimientos.find(e => e.id === mesa.id_establecimiento) : null;
                        const partido = data.partidos.find(p => p.id === res.id_partido);
                        return { ...res, mesa, est, partido };
                    }).filter(res => res.est && res.partido && res.mesa).map(res => (
                        <tr key={res.id} className={res.esDudosa ? 'dudosa' : ''}>
                            <td>{res.est.nombre}</td>
                            <td>Mesa: {res.mesa.numero} {res.esDudosa && '⚠️'}</td>
                            <td>{res.partido.nombre}</td>
                            <td>{res.cantidad_votos.toLocaleString('es-AR')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

function App() {
    const [data, setData] = useState({});
    const [vista, setVista] = useState('publico');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        fetch(`${SOCKET_URL}/api/estado`).then(res => res.json()).then(setData).catch(err => console.error("Error al cargar estado inicial:", err));
        
        socket.on('actualizacion_global', (serverState) => { 
            setData(serverState); 
        });
        
        return () => {
            socket.off('actualizacion_global');
        }
    }, []);

    const handleLogin = () => { setIsLoggedIn(true); setVista('admin'); };
    const handleLogout = () => { setIsLoggedIn(false); setVista('publico'); };

    return (
        <div className="App">
            <nav>
                <button onClick={() => setVista('publico')}>Dashboard Público</button>
                <button onClick={() => setVista('admin')}>
                    {isLoggedIn ? 'Panel de Administración' : 'Login Admin'}
                </button>
            </nav>
            <main>
                {vista === 'publico' && <PublicDashboard data={data} />}
                {vista === 'admin' && !isLoggedIn && <LoginScreen onLogin={handleLogin} />}
                {vista === 'admin' && isLoggedIn && <AdminPanel data={data} onLogout={handleLogout} />}
            </main>
        </div>
    );
}

export default App;