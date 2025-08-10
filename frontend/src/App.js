// CÓDIGO CORRECTO PARA app.js

import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css'; 

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
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
            <h3>Partidos Políticos</h3>
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
            <h3>Establecimientos</h3>
            <ul>
                {establecimientos.map(e => <li key={e.id}><span>{e.nombre} ({e.direccion})</span><button onClick={() => onDelete(e.id)} className="delete-btn">X</button></li>)}
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
            <h3>Mesas</h3>
            <ul>
                {mesas.map(m => {
                    const est = establecimientos.find(e => e.id === m.id_establecimiento);
                    return (
                        <li key={m.id}>
                            <span>Mesa: {m.numero} ({est ? est.nombre : 'N/A'})</span>
                            <button onClick={() => onDelete(m.id)} className="delete-btn">X</button>
                        </li>
                    );
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

    useEffect(() => {
        if (!idMesa) {
            const initialState = {};
            partidos.forEach(p => { initialState[p.id] = ''; });
            setVotos(initialState);
            setEsDudosa(false);
            return;
        }

        const resultadosDeLaMesa = data.resultados?.filter(r => r.id_mesa === idMesa) || [];
        
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
        setVotos(prev => ({...prev, [id_partido]: cantidad}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!idMesa) return;
        const votosPayload = Object.entries(votos).map(([id_partido, cantidad]) => ({
            id_partido,
            cantidad: parseInt(cantidad) || 0
        }));
        onCargar({ id_mesa: idMesa, votos: votosPayload, esDudosa });
    };

    return (
        <div className="gestion-section carga-votos">
            <h3>Carga y Modificación de Votos</h3>
            <form onSubmit={handleSubmit}>
                <select value={idMesa} onChange={e => setIdMesa(e.target.value)} required>
                    <option value="">-- Seleccionar Mesa --</option>
                    {establecimientos.map(est => (
                        <optgroup label={est.nombre} key={est.id}>
                            {mesas.filter(m => m.id_establecimiento === est.id).sort((a,b) => parseInt(a.numero) - parseInt(b.numero)).map(m => (
                                <option key={m.id} value={m.id}>Mesa: {m.numero}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                
                {idMesa && (
                    <>
                        <div className="votos-inputs">
                            {partidos.map(p => (
                                <div key={p.id}>
                                    <label>{p.nombre}</label>
                                    <input 
                                        type="number" 
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
                        <button type="submit">Guardar Votos de la Mesa</button>
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
                <GestionPartidos partidos={data.partidos || []} onAdd={(body) => handleApiCall('/api/partidos', 'POST', body)} onDelete={(id) => handleApiCall(`/api/partidos/${id}`, 'DELETE')} />
                <GestionEstablecimientos establecimientos={data.establecimientos || []} onAdd={(body) => handleApiCall('/api/establecimientos', 'POST', body)} onDelete={(id) => handleApiCall(`/api/establecimientos/${id}`, 'DELETE')} />
                <GestionMesas 
                    mesas={data.mesas || []} 
                    establecimientos={data.establecimientos || []} 
                    onAdd={(body) => handleApiCall('/api/mesas', 'POST', body)} 
                    onDelete={(id) => handleApiCall(`/api/mesas/${id}`, 'DELETE')}
                />
                <CargaVotos 
                    data={data}
                    partidos={data.partidos || []} 
                    mesas={data.mesas || []} 
                    establecimientos={data.establecimientos || []} 
                    onCargar={(body) => handleApiCall('/api/cargar-votos', 'POST', body)} 
                />
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

const calculatedData = useMemo(() => {
    if (!data.resultados || !data.partidos) {
        return { chartData: { labels: [], datasets: [] }, totals: {} };
    }

    // 1. DEFINIR LA PALETA DE COLORES
    // Aquí es donde asignas un color a cada partido.
    // El nombre del partido debe ser EXACTAMENTE igual a como lo tienes en la base de datos.
    // Pega este objeto completo y corregido
const coloresPorPartido = {
    // Nombres exactos de tu base de datos
    "ALIANZA LA LIBERTAD AVANZA": "#7D22A8",
    "PARTIDO LIBERTARIO": "#FFD700",
    "ALIANZA UNION Y LIBERTAD": "#2ecc71",       // Verde
    "MOVIMIENTO AVANZADA SOCIALISTA": "#e74c3c", // Rojo
    "ALIANZA SOMOS BUENOS AIRES": "#3498db",  // Azul
    "PARTIDO FRENTE PATRIOTA FEDERAL": "#f1c40f", // Amarillo oscuro
    "PARTIDO POLITICA OBRERA": "#e67e22",      // Naranja
    "ALIANZA POTENCIA": "#1abc9c",             // Turquesa
    "ALIANZA NUEVOS AIRES": "#9b59b6",         // Morado claro
    // Añade cualquier otro partido aquí
};```


    // (El resto de la lógica de filtros y conteo de votos no cambia)
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

    // 2. GENERAR EL ARRAY DE COLORES EN EL ORDEN CORRECTO
    // Recorremos los resultados ya ordenados y creamos una lista de colores
    // que coincide con el orden de las barras en el gráfico.
    const coloresDeBarras = sortedTotals.map(([nombrePartido, _]) => {
        // Busca el color en nuestra paleta. Si no lo encuentra, usa un color azul por defecto.
        return coloresPorPartido[nombrePartido] || '#36A2EB'; 
    });

    // 3. CONSTRUIR LOS DATOS DEL GRÁFICO
    const chartData = {
        labels: sortedTotals.map(item => item[0]),
        datasets: [{ 
            label: 'Votos', 
            data: sortedTotals.map(item => item[1]), 
            backgroundColor: coloresDeBarras // Usamos nuestro array de colores dinámico
        }],
    };

    return { chartData, totals: votosPorPartido };

}, [data, filtroEst, filtroMesa]);

    const [filtroEst, setFiltroEst] = useState('todos');
    const [filtroMesa, setFiltroMesa] = useState('todos');

    const calculatedData = useMemo(() => {
        if (!data.resultados || !data.partidos) return { chartData: { labels: [], datasets: [] }, totals: {} };
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
        const chartData = {
            labels: sortedTotals.map(item => item[0]),
            datasets: [{ label: 'Votos', data: sortedTotals.map(item => item[1]), backgroundColor: ['#74C6F4', '#FFB347', '#83F28F', '#FF6384', '#36A2EB'] }],
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

    if (!data.partidos) return <p>Esperando datos del servidor...</p>;

    return (
        <div className="public-dashboard">
            <h1>Resultados Electorales - La Libertad Avanza Avellaneda</h1>
            <div className="filtros">
                <select value={filtroEst} onChange={e => { setFiltroEst(e.target.value); setFiltroMesa('todos'); }}>
                    <option value="todos">Todos los Establecimientos</option>
                    {(data.establecimientos || []).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(est => <option key={est.id} value={est.id}>{est.nombre}</option>)}
                </select>
                <select value={filtroMesa} onChange={e => setFiltroMesa(e.target.value)} disabled={filtroEst === 'todos'}>
                    <option value="todos">Todas las Mesas</option>
                    {(data.mesas || []).filter(m => m.id_establecimiento === filtroEst).sort((a,b) => parseInt(a.numero) - parseInt(b.numero)).map(mesa => <option key={mesa.id} value={mesa.id}>Mesa: {mesa.numero}</option>)}
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
                    }).filter(res => res.est && res.partido && res.mesa).sort((a, b) => parseInt(a.mesa.numero) - parseInt(b.mesa.numero)).map(res => (
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
        socket.on('connect', () => {
            console.log('Conectado al servidor de websockets.');
        });
        fetch(`${SOCKET_URL}/api/estado`).then(res => res.json()).then(setData).catch(err => console.error("Error al cargar estado inicial:", err));
        socket.on('actualizacion_global', (serverState) => { 
            console.log('Recibida actualizacion_global');
            setData(serverState); 
        });
        return () => {
            socket.off('connect');
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