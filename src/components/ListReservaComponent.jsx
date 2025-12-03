import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import AuthService from '../services/AuthService';
import { listReservas, deleteReserva, confirmarReserva, getMisReservaciones } from "../services/ReservaService";
import { listClientes, getClienteByUsername } from "../services/ClienteService";
import { listMesas } from "../services/MesaService";
import {
    Calendar, Plus, Edit, Trash2, Eye, Clock,
    User, Table, CheckCircle, XCircle, AlertCircle,
    Check, Search, Filter, Users, MapPin, Phone,
    Mail, ChevronDown, ChevronUp, SortAsc, SortDesc
} from "lucide-react";

export const ListReservaComponent = () => {
    const [reservas, setReservas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [mesas, setMesas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODAS');
    const [filtroFecha, setFiltroFecha] = useState('TODAS');
    const [vistaActiva, setVistaActiva] = useState('futuras'); // 'futuras' o 'historial'
    const [ordenarPor, setOrdenarPor] = useState('fecha'); // 'fecha', 'hora', 'cliente'
    const [ordenAscendente, setOrdenAscendente] = useState(true);
    const [reservaExpandida, setReservaExpandida] = useState(null);
    const navigate = useNavigate();

    // --- LÓGICA DE ROLES ---
    const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
    const [userRoles, setUserRoles] = useState(currentUser?.roles || []);

    const esCliente = userRoles.includes('ROLE_CLIENTE');
    const esStaff = userRoles.some(role => 
        ['ROLE_ADMINISTRADOR', 'ROLE_SUPERVISOR', 'ROLE_CAJERO', 'ROLE_MESERO'].includes(role)
    );

    const getEstadoInfo = (estado) => {
        const estados = {
            'CONFIRMADA': { 
                color: 'success', 
                label: 'Confirmada', 
                icon: CheckCircle,
                bgColor: '#d1fae5',
                textColor: '#065f46'
            },
            'PENDIENTE': { 
                color: 'warning', 
                label: 'Pendiente', 
                icon: AlertCircle,
                bgColor: '#fef3c7',
                textColor: '#92400e'
            },
            'CANCELADA': { 
                color: 'danger', 
                label: 'Cancelada', 
                icon: XCircle,
                bgColor: '#fecaca',
                textColor: '#991b1b'
            },
            'COMPLETADA': { 
                color: 'info', 
                label: 'Completada', 
                icon: CheckCircle,
                bgColor: '#dbeafe',
                textColor: '#1e40af'
            }
        };
        return estados[estado] || { color: 'light', label: estado, icon: AlertCircle };
    };

    const parseLocalDate = (fechaStr) => {
        if (!fechaStr) return null;
        const [year, month, day] = fechaStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const puedeConfirmar = (reserva) => {
        if (reserva.estado !== 'PENDIENTE') {
            return false;
        }

        const ahora = new Date();
        const fechaReserva = parseLocalDate(reserva.fecha);

        // Solo permitir reservas del mismo día (hoy)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaReservaNormalizada = new Date(fechaReserva);
        fechaReservaNormalizada.setHours(0, 0, 0, 0);

        if (fechaReservaNormalizada.getTime() !== hoy.getTime()) {
            return false;
        }

        // Calcular la hora de la reserva
        const [horas, minutos] = reserva.hora.split(':').map(Number);
        const fechaHoraReserva = new Date(fechaReserva);
        fechaHoraReserva.setHours(horas, minutos, 0, 0);

        // Calcular diferencia en minutos
        const diferenciaMs = fechaHoraReserva - ahora;
        const diferenciaMinutos = Math.floor(diferenciaMs / (1000 * 60));

        // Se puede confirmar si quedan más de 15 minutos
        return diferenciaMinutos > 15;
    };

    const esMismaFecha = (fechaStr, fechaComparar) => {
        const fecha = parseLocalDate(fechaStr);
        return fecha.getDate() === fechaComparar.getDate() &&
            fecha.getMonth() === fechaComparar.getMonth() &&
            fecha.getFullYear() === fechaComparar.getFullYear();
    };

    const handleConfirmarReserva = (reserva) => {
        if (!puedeConfirmar(reserva)) {
            const razon = reserva.estado !== 'PENDIENTE' 
                ? 'La reserva no está pendiente'
                : !esMismaFecha(reserva.fecha, new Date())
                    ? 'Solo se pueden confirmar reservas para hoy'
                    : 'Debe confirmarse con al menos 15 minutos de anticipación';
            
            Swal.fire({
                title: 'No se puede confirmar',
                text: razon,
                icon: 'warning',
                confirmButtonColor: '#3E6770'
            });
            return;
        }

        Swal.fire({
            title: '¿Confirmar Reserva?',
            html: `
                <div class="text-start">
                    <p>¿Estás seguro de confirmar esta reserva?</p>
                    <div class="alert alert-info mt-2">
                        <small>
                            <strong>Cliente:</strong> ${obtenerNombreCliente(reserva.idCliente)}<br/>
                            <strong>Fecha:</strong> ${formatearFecha(reserva.fecha)}<br/>
                            <strong>Hora:</strong> ${formatearHora(reserva.hora)}<br/>
                            <strong>Mesa:</strong> ${obtenerInfoMesa(reserva.idMesa)}
                        </small>
                    </div>
                    <p class="text-success mt-2"><small>La reserva pasará a estado CONFIRMADA.</small></p>
                </div>
            `,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, CONFIRMAR',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                confirmarReserva(reserva.id)
                    .then(() => {
                        Swal.fire({
                            title: '¡Confirmada!',
                            text: 'La reserva ha sido confirmada exitosamente.',
                            icon: 'success',
                            confirmButtonColor: '#3E6770'
                        });
                        cargarDatos();
                    })
                    .catch(error => {
                        console.error("Error al confirmar reserva:", error);
                        const errorMsg = error.response?.data || "Error al confirmar la reserva.";
                        Swal.fire({
                            title: 'Error',
                            text: errorMsg,
                            icon: 'error',
                            confirmButtonColor: '#3E6770'
                        });
                    });
            }
        });
    };

    // --- CARGA DE DATOS CON LÓGICA DE ROLES ---
    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            let reservasPromise;
            let clientesPromise = Promise.resolve({ data: [] });
            let mesasPromise = listMesas();

            // LÓGICA DE ROLES
            if (esStaff) {
                // Staff: carga TODAS las reservas y TODOS los clientes
                reservasPromise = listReservas();
                clientesPromise = listClientes();
            } else if (esCliente) {
                // Cliente: carga SOLO sus reservas
                reservasPromise = getMisReservaciones();
                clientesPromise = getClienteByUsername(currentUser.sub)
                    .then(res => ({ data: [res.data] }));
                // No cargamos la lista completa de clientes para clientes
            } else {
                // Usuario sin rol definido
                throw new Error("Usuario sin rol definido para ver reservas");
            }

            const [reservasRes, clientesRes, mesasRes] = await Promise.all([
                reservasPromise,
                clientesPromise,
                mesasPromise
            ]);

            setReservas(reservasRes.data || []);
            setClientes(clientesRes.data || []);
            setMesas(mesasRes.data || []);
            setError(null);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            setError("No se pudieron cargar las reservas. Intente de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const navegarCrear = () => navigate('/reserva/crear');
    const navegarEditar = (id) => navigate(`/reserva/editar/${id}`);
    const navegarDetalle = (id) => navigate(`/reserva/detalle/${id}`);

    const obtenerNombreCliente = (idCliente) => {
        // Si soy cliente, asumo que todas las reservas que veo son mías o a mi nombre
        if (esCliente) {
             // Opcional: Podrías devolver el nombre del usuario logueado si lo tienes en 'currentUser'
             return currentUser.sub || "Mi Reserva"; 
        }
        
        // Si soy staff, busco en la lista completa de clientes
        const cliente = clientes.find(c => c.id === idCliente);
        return cliente ? cliente.nombreCliente : `Cliente #${idCliente}`;
    };

    const obtenerClienteCompleto = (idCliente) => {
        return clientes.find(c => c.id === idCliente);
    };

    const obtenerInfoMesa = (idMesa) => {
        const mesa = mesas.find(m => m.id === idMesa);
        return mesa ? `Mesa #${mesa.numero} (${mesa.ubicacion})` : 'Mesa no encontrada';
    };

    const obtenerMesaCompleta = (idMesa) => {
        return mesas.find(m => m.id === idMesa);
    };

    const formatearFecha = (fecha) => {
        const fechaLocal = parseLocalDate(fecha);
        if (!fechaLocal) return '';

        return fechaLocal.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearHora = (hora) => {
        return hora.substring(0, 5);
    };

    const eliminarReserva = (reserva) => {
        Swal.fire({
            title: `¿Cancelar Reserva?`,
            html: `
                <div class="text-start">
                    <p>¿Estás seguro de cancelar esta reserva?</p>
                    <div class="alert alert-warning mt-2">
                        <small>
                            <strong>Cliente:</strong> ${obtenerNombreCliente(reserva.idCliente)}<br/>
                            <strong>Fecha:</strong> ${formatearFecha(reserva.fecha)}<br/>
                            <strong>Hora:</strong> ${formatearHora(reserva.hora)}<br/>
                            <strong>Mesa:</strong> ${obtenerInfoMesa(reserva.idMesa)}
                        </small>
                    </div>
                    <p class="text-danger mt-2"><small>Esta acción no se puede deshacer.</small></p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, CANCELAR',
            cancelButtonText: 'Mantener'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteReserva(reserva.id)
                    .then(() => {
                        Swal.fire({
                            title: '¡Cancelada!',
                            text: 'La reserva ha sido cancelada exitosamente.',
                            icon: 'success',
                            confirmButtonColor: '#3E6770'
                        });
                        cargarDatos();
                    })
                    .catch(error => {
                        console.error("Error al cancelar reserva:", error);
                        const errorMsg = error.response?.data || "Error al cancelar la reserva.";
                        Swal.fire({
                            title: 'Error',
                            text: errorMsg,
                            icon: 'error',
                            confirmButtonColor: '#3E6770'
                        });
                    });
            }
        });
    };

    // Filtrar y ordenar reservas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const reservasFuturas = reservas.filter(r => {
        const fechaR = parseLocalDate(r.fecha);
        return fechaR >= hoy;
    });

    const reservasPasadas = reservas.filter(r => {
        const fechaR = parseLocalDate(r.fecha);
        return fechaR < hoy;
    });

    // Aplicar filtros
    const reservasFiltradas = (vistaActiva === 'futuras' ? reservasFuturas : reservasPasadas).filter(reserva => {
        const coincideCliente = obtenerNombreCliente(reserva.idCliente).toLowerCase().includes(filtro.toLowerCase());
        const coincideEstado = filtroEstado === 'TODAS' || reserva.estado === filtroEstado;
        const coincideFecha = filtroFecha === 'TODAS' || 
                            (filtroFecha === 'HOY' && esMismaFecha(reserva.fecha, new Date())) ||
                            (filtroFecha === 'MANANA' && esMismaFecha(reserva.fecha, new Date(Date.now() + 86400000)));
        
        return coincideCliente && coincideEstado && coincideFecha;
    });

    // Ordenar reservas
    const reservasOrdenadas = [...reservasFiltradas].sort((a, b) => {
        let comparacion = 0;
        
        switch (ordenarPor) {
            case 'fecha':
                comparacion = parseLocalDate(a.fecha) - parseLocalDate(b.fecha);
                break;
            case 'hora':
                comparacion = a.hora.localeCompare(b.hora);
                break;
            case 'cliente':
                comparacion = obtenerNombreCliente(a.idCliente).localeCompare(obtenerNombreCliente(b.idCliente));
                break;
            case 'estado':
                comparacion = a.estado.localeCompare(b.estado);
                break;
            default:
                comparacion = 0;
        }
        
        return ordenAscendente ? comparacion : -comparacion;
    });

    // Estadísticas (solo para staff)
    const estadisticas = {
        total: reservas.length,
        pendientes: reservas.filter(r => r.estado === 'PENDIENTE').length,
        confirmadas: reservas.filter(r => r.estado === 'CONFIRMADA').length,
        completadas: reservas.filter(r => r.estado === 'COMPLETADA').length,
        canceladas: reservas.filter(r => r.estado === 'CANCELADA').length,
        hoy: reservas.filter(r => esMismaFecha(r.fecha, new Date())).length
    };

    // Componente de Tarjeta de Reserva
    const ReservaCard = ({ reserva }) => {
        const estadoInfo = getEstadoInfo(reserva.estado);
        const esConfirmable = puedeConfirmar(reserva);
        const cliente = obtenerClienteCompleto(reserva.idCliente);
        const mesa = obtenerMesaCompleta(reserva.idMesa);
        const estaExpandida = reservaExpandida === reserva.id;

        return (
            <div className={`reserva-card ${reserva.estado.toLowerCase()}`}>
                <div className="reserva-header">
                    <div className="reserva-info-principal">
                        <div className="reserva-cliente">
                            <User size={16} />
                            <strong>{obtenerNombreCliente(reserva.idCliente)}</strong>
                        </div>
                        <div className="reserva-mesa">
                            <Table size={16} />
                            <span>{obtenerInfoMesa(reserva.idMesa)}</span>
                        </div>
                    </div>
                    
                    <div className="reserva-fecha-hora">
                        <div className="reserva-fecha">
                            <Calendar size={16} />
                            <span>{formatearFecha(reserva.fecha)}</span>
                        </div>
                        <div className="reserva-hora">
                            <Clock size={16} />
                            <span>{formatearHora(reserva.hora)}</span>
                        </div>
                    </div>

                    <div 
                        className="reserva-estado"
                        style={{
                            backgroundColor: estadoInfo.bgColor,
                            color: estadoInfo.textColor
                        }}
                    >
                        <estadoInfo.icon size={14} />
                        <span>{estadoInfo.label}</span>
                    </div>

                    <button
                        className="btn-expand"
                        onClick={() => setReservaExpandida(estaExpandida ? null : reserva.id)}
                    >
                        {estaExpandida ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {estaExpandida && (
                    <div className="reserva-detalles">
                        <div className="detalle-seccion">
                            <h6>Información del Cliente</h6>
                            <div className="detalle-info">
                                <div className="info-item">
                                    <User size={14} />
                                    <span><strong>Nombre:</strong> {cliente?.nombreCliente || 'N/A'}</span>
                                </div>
                                {cliente?.telefono && (
                                    <div className="info-item">
                                        <Phone size={14} />
                                        <span><strong>Teléfono:</strong> {cliente.telefono}</span>
                                    </div>
                                )}
                                {cliente?.correo && (
                                    <div className="info-item">
                                        <Mail size={14} />
                                        <span><strong>Email:</strong> {cliente.correo}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="detalle-seccion">
                            <h6>Información de la Mesa</h6>
                            <div className="detalle-info">
                                <div className="info-item">
                                    <Table size={14} />
                                    <span><strong>Número:</strong> {mesa?.numero || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <MapPin size={14} />
                                    <span><strong>Ubicación:</strong> {mesa?.ubicacion || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <Users size={14} />
                                    <span><strong>Capacidad:</strong> {mesa?.capacidad || 'N/A'} personas</span>
                                </div>
                            </div>
                        </div>

                        <div className="reserva-actions">
                            <button
                                className="btn-action btn-view"
                                onClick={() => navegarDetalle(reserva.id)}
                                title="Ver detalle completo"
                            >
                                <Eye size={16} />
                                <span>Detalles</span>
                            </button>

                            {reserva.estado === 'PENDIENTE' && esStaff && (
                                <button
                                    className="btn-action btn-confirm"
                                    onClick={() => handleConfirmarReserva(reserva)}
                                    disabled={!esConfirmable}
                                    title={esConfirmable 
                                        ? "Confirmar reserva" 
                                        : "No se puede confirmar - requiere 15 min de anticipación"
                                    }
                                >
                                    <Check size={16} />
                                    <span>Confirmar</span>
                                </button>
                            )}

                            {esStaff && (
                                <>
                                    <button
                                        className="btn-action btn-edit"
                                        onClick={() => navegarEditar(reserva.id)}
                                        title="Editar reserva"
                                    >
                                        <Edit size={16} />
                                        <span>Editar</span>
                                    </button>

                                    <button
                                        className="btn-action btn-delete"
                                        onClick={() => eliminarReserva(reserva)}
                                        title="Cancelar reserva"
                                    >
                                        <Trash2 size={16} />
                                        <span>Cancelar</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="page-wrap">
            <div className="container-fluid">
                {/* Header Mejorado */}
                <div className="restaurant-header">
                    <div className="header-content">
                        <div className="header-title">
                            <Calendar size={32} className="header-icon" />
                            <div>
                                <h1>
                                    {esCliente ? 'Mis Reservas' : 'Gestión de Reservas'}
                                </h1>
                                <p>
                                    {esCliente 
                                        ? 'Consulta y administra tus reservas' 
                                        : 'Administra y controla las reservas del restaurante'
                                    }
                                </p>
                            </div>
                        </div>
                        {(esStaff || esCliente) && (
                            <button className="btn-primary btn-lg" onClick={navegarCrear}>
                                <Plus size={20} className="me-2"/>
                                Nueva Reserva
                            </button>
                        )}
                    </div>
                </div>

                {/* Panel de Estadísticas Mejorado (solo para staff) */}
                {esStaff && (
                    <div className="stats-panel">
                        <div className="stat-card total">
                            <div className="stat-icon">
                                <Calendar size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>{estadisticas.total}</h3>
                                <span>Total Reservas</span>
                            </div>
                        </div>
                        <div className="stat-card pending">
                            <div className="stat-icon">
                                <AlertCircle size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>{estadisticas.pendientes}</h3>
                                <span>Pendientes</span>
                            </div>
                        </div>
                        <div className="stat-card confirmed">
                            <div className="stat-icon">
                                <CheckCircle size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>{estadisticas.confirmadas}</h3>
                                <span>Confirmadas</span>
                            </div>
                        </div>
                        <div className="stat-card today">
                            <div className="stat-icon">
                                <Clock size={24} />
                            </div>
                            <div className="stat-info">
                                <h3>{estadisticas.hoy}</h3>
                                <span>Para Hoy</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Controles de Vista y Filtros */}
                <div className="controls-panel">
                    <div className="view-toggle">
                        <button 
                            className={`view-btn ${vistaActiva === 'futuras' ? 'active' : ''}`}
                            onClick={() => setVistaActiva('futuras')}
                        >
                            <Calendar size={18} className="me-2" />
                            Reservas Futuras ({reservasFuturas.length})
                        </button>
                        <button 
                            className={`view-btn ${vistaActiva === 'historial' ? 'active' : ''}`}
                            onClick={() => setVistaActiva('historial')}
                        >
                            <Clock size={18} className="me-2" />
                            Historial ({reservasPasadas.length})
                        </button>
                    </div>

                    <div className="filters-section">
                        <div className="search-box">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder={esCliente ? "Buscar en mis reservas..." : "Buscar por nombre de cliente..."}
                                value={filtro}
                                onChange={(e) => setFiltro(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        
                        <div className="filters">
                            <Filter size={18} />
                            <select 
                                value={filtroEstado} 
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="filter-select"
                            >
                                <option value="TODAS">Todos los estados</option>
                                <option value="PENDIENTE">Pendientes</option>
                                <option value="CONFIRMADA">Confirmadas</option>
                                <option value="COMPLETADA">Completadas</option>
                                <option value="CANCELADA">Canceladas</option>
                            </select>
                            
                            <select 
                                value={filtroFecha} 
                                onChange={(e) => setFiltroFecha(e.target.value)}
                                className="filter-select"
                            >
                                <option value="TODAS">Todas las fechas</option>
                                <option value="HOY">Hoy</option>
                                <option value="MANANA">Mañana</option>
                            </select>
                        </div>

                        <div className="sort-controls">
                            <select 
                                value={ordenarPor} 
                                onChange={(e) => setOrdenarPor(e.target.value)}
                                className="sort-select"
                            >
                                <option value="fecha">Ordenar por fecha</option>
                                <option value="hora">Ordenar por hora</option>
                                <option value="cliente">Ordenar por cliente</option>
                                <option value="estado">Ordenar por estado</option>
                            </select>
                            <button
                                className="btn-sort"
                                onClick={() => setOrdenAscendente(!ordenAscendente)}
                                title={ordenAscendente ? "Orden ascendente" : "Orden descendente"}
                            >
                                {ordenAscendente ? <SortAsc size={16} /> : <SortDesc size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="filter-info">
                        <span className="text-muted small">
                            Mostrando {reservasOrdenadas.length} de {vistaActiva === 'futuras' ? reservasFuturas.length : reservasPasadas.length} reservas
                            {filtro && ` • Filtrado por: "${filtro}"`}
                        </span>
                    </div>
                </div>

                {/* Contenido Principal */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Cargando reservas...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <AlertCircle size={48} className="error-icon" />
                        <h3>Error al cargar las reservas</h3>
                        <p>{error}</p>
                        <button className="btn-retry" onClick={cargarDatos}>
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <div className="reservas-grid">
                        {reservasOrdenadas.length === 0 ? (
                            <div className="empty-state">
                                <Calendar size={64} className="empty-icon" />
                                <h3>No se encontraron reservas</h3>
                                <p>
                                    {vistaActiva === 'futuras' 
                                        ? esCliente
                                            ? "No tienes reservas futuras programadas."
                                            : "No hay reservas futuras que coincidan con los filtros."
                                        : esCliente
                                            ? "No tienes reservas en tu historial."
                                            : "No hay reservas en el historial que coincidan con los filtros."
                                    }
                                </p>
                                {vistaActiva === 'futuras' && (esStaff || esCliente) && (
                                    <button 
                                        className="btn-primary mt-3"
                                        onClick={navegarCrear}
                                    >
                                        <Plus size={16} className="me-2" />
                                        Crear Primera Reserva
                                    </button>
                                )}
                            </div>
                        ) : (
                            reservasOrdenadas.map((reserva) => (
                                <ReservaCard key={reserva.id} reserva={reserva} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListReservaComponent;