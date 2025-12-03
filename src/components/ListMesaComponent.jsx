import React, { useEffect, useState } from 'react';
import { 
    Table, Plus, Edit, Trash2, Eye, MapPin, Users, 
    Clock, CheckCircle, XCircle, AlertCircle, Search,
    Layout, Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import { listMesas, deleteMesa } from "../services/MesaService";

export const ListMesaComponent = () => {
    const [mesas, setMesas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState('TODAS');
    const [busqueda, setBusqueda] = useState('');
    const [vista, setVista] = useState('grid'); // 'grid' o 'lista'
    const navigate = useNavigate();

    const getEstadoInfo = (estado) => {
        const estados = {
            'DISPONIBLE': { 
                color: 'success', 
                label: 'Disponible',
                icon: CheckCircle,
                bgColor: '#d1fae5',
                textColor: '#065f46'
            },
            'OCUPADA': { 
                color: 'danger', 
                label: 'Ocupada',
                icon: Clock,
                bgColor: '#fee2e2',
                textColor: '#991b1b'
            },
            'RESERVADA': { 
                color: 'warning', 
                label: 'Reservada',
                icon: AlertCircle,
                bgColor: '#fef3c7',
                textColor: '#92400e'
            },
            'MANTENIMIENTO': { 
                color: 'secondary', 
                label: 'Mantenimiento',
                icon: XCircle,
                bgColor: '#e5e7eb',
                textColor: '#374151'
            }
        };
        return estados[estado] || { color: 'light', label: estado, icon: AlertCircle };
    };

    const cargarMesas = () => {
        setLoading(true);
        listMesas()
            .then((response) => {
                setMesas(response.data || []);
                setError(null);
            })
            .catch((error) => {
                console.error("Error al cargar mesas:", error);
                setError("No se pudieron cargar las mesas. Intente de nuevo.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        cargarMesas();
    }, []);

    // Filtrar mesas
    const mesasFiltradas = mesas.filter(mesa => {
        const coincideEstado = filtroEstado === 'TODAS' || mesa.estado === filtroEstado;
        const coincideBusqueda = mesa.numero.toString().includes(busqueda) || 
                               mesa.ubicacion.toLowerCase().includes(busqueda.toLowerCase());
        return coincideEstado && coincideBusqueda;
    });

    const navegarCrear = () => navigate('/mesa/crear');
    const navegarEditar = (id) => navigate(`/mesa/editar/${id}`);
    const navegarDetalle = (id) => navigate(`/mesa/detalle/${id}`);

    const eliminarMesa = (mesa) => {
        Swal.fire({
            title: `¿Eliminar Mesa #${mesa.numero}?`,
            html: `
                <div class="text-start">
                    <p>¿Estás seguro de eliminar esta mesa?</p>
                    <div class="alert alert-warning mt-2">
                        <small>
                            <strong>Ubicación:</strong> ${mesa.ubicacion}<br/>
                            <strong>Capacidad:</strong> ${mesa.capacidad} personas<br/>
                            <strong>Estado:</strong> ${mesa.estado}
                        </small>
                    </div>
                    <p class="text-danger mt-2"><small>Esta acción no se puede deshacer.</small></p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#3E6770',
            confirmButtonText: 'Sí, ELIMINAR',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMesa(mesa.id)
                    .then(() => {
                        Swal.fire({
                            title: '¡Eliminada!',
                            text: 'La mesa ha sido eliminada exitosamente.',
                            icon: 'success',
                            confirmButtonColor: '#3E6770'
                        });
                        cargarMesas();
                    })
                    .catch(error => {
                        console.error("Error al eliminar mesa:", error);
                        const errorMsg = error.response?.data || "Error al eliminar la mesa.";
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

    // Estadísticas
    const estadisticas = {
        total: mesas.length,
        disponibles: mesas.filter(m => m.estado === 'DISPONIBLE').length,
        ocupadas: mesas.filter(m => m.estado === 'OCUPADA').length,
        reservadas: mesas.filter(m => m.estado === 'RESERVADA').length,
        mantenimiento: mesas.filter(m => m.estado === 'MANTENIMIENTO').length
    };

    // Componente de Tarjeta de Mesa para Vista Grid
    const MesaCard = ({ mesa }) => {
        const estadoInfo = getEstadoInfo(mesa.estado);
        const EstadoIcon = estadoInfo.icon;
        
        return (
            <div className="mesa-card" data-estado={mesa.estado}>
                <div className="mesa-card-header">
                    <div className="mesa-numero">
                        <span>Mesa</span>
                        <h3>#{mesa.numero}</h3>
                    </div>
                    <div className="mesa-estado" style={{ 
                        backgroundColor: estadoInfo.bgColor,
                        color: estadoInfo.textColor
                    }}>
                        <EstadoIcon size={14} />
                        <span>{estadoInfo.label}</span>
                    </div>
                </div>
                
                <div className="mesa-info">
                    <div className="mesa-detalle">
                        <MapPin size={16} />
                        <span>{mesa.ubicacion}</span>
                    </div>
                    <div className="mesa-detalle">
                        <Users size={16} />
                        <span>{mesa.capacidad} personas</span>
                    </div>
                </div>
                
                <div className="mesa-actions">
                    <button
                        className="btn-action btn-view"
                        onClick={() => navegarDetalle(mesa.id)}
                        title="Ver detalle"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        className="btn-action btn-edit"
                        onClick={() => navegarEditar(mesa.id)}
                        title="Editar mesa"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        className="btn-action btn-delete"
                        onClick={() => eliminarMesa(mesa)}
                        title="Eliminar mesa"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
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
                            <Table size={32} className="header-icon" />
                            <div>
                                <h1>Gestión de Mesas</h1>
                                <p>Administra la distribución y estado de las mesas del restaurante</p>
                            </div>
                        </div>
                        <button className="btn-primary btn-lg" onClick={navegarCrear}>
                            <Plus size={20} className="me-2"/>
                            Nueva Mesa
                        </button>
                    </div>
                </div>

                {/* Panel de Estadísticas Mejorado */}
                <div className="stats-panel">
                    <div className="stat-card total">
                        <div className="stat-icon">
                            <Table size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{estadisticas.total}</h3>
                            <span>Total Mesas</span>
                        </div>
                    </div>
                    <div className="stat-card available">
                        <div className="stat-icon">
                            <CheckCircle size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{estadisticas.disponibles}</h3>
                            <span>Disponibles</span>
                        </div>
                    </div>
                    <div className="stat-card occupied">
                        <div className="stat-icon">
                            <Clock size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{estadisticas.ocupadas}</h3>
                            <span>Ocupadas</span>
                        </div>
                    </div>
                    <div className="stat-card reserved">
                        <div className="stat-icon">
                            <AlertCircle size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{estadisticas.reservadas}</h3>
                            <span>Reservadas</span>
                        </div>
                    </div>
                    <div className="stat-card maintenance">
                        <div className="stat-icon">
                            <XCircle size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{estadisticas.mantenimiento}</h3>
                            <span>Mantenimiento</span>
                        </div>
                    </div>
                </div>

                {/* Controles de Filtro y Vista */}
                <div className="controls-panel">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por número o ubicación..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
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
                            <option value="TODAS">Todas las mesas</option>
                            <option value="DISPONIBLE">Disponibles</option>
                            <option value="OCUPADA">Ocupadas</option>
                            <option value="RESERVADA">Reservadas</option>
                            <option value="MANTENIMIENTO">Mantenimiento</option>
                        </select>
                    </div>

                    <div className="view-toggle">
                        <button 
                            className={`view-btn ${vista === 'grid' ? 'active' : ''}`}
                            onClick={() => setVista('grid')}
                            title="Vista cuadrícula"
                        >
                            <Layout size={18} />
                        </button>
                        <button 
                            className={`view-btn ${vista === 'lista' ? 'active' : ''}`}
                            onClick={() => setVista('lista')}
                            title="Vista lista"
                        >
                            <Table size={18} />
                        </button>
                    </div>
                </div>

                {/* Contenido Principal */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Cargando mesas...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <AlertCircle size={48} className="error-icon" />
                        <h3>Error al cargar las mesas</h3>
                        <p>{error}</p>
                        <button className="btn-retry" onClick={cargarMesas}>
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Vista Grid */}
                        {vista === 'grid' && (
                            <div className="mesas-grid">
                                {mesasFiltradas.length === 0 ? (
                                    <div className="empty-state">
                                        <Table size={64} className="empty-icon" />
                                        <h3>No se encontraron mesas</h3>
                                        <p>No hay mesas que coincidan con los filtros aplicados.</p>
                                        <button 
                                            className="btn-clear-filters"
                                            onClick={() => {
                                                setFiltroEstado('TODAS');
                                                setBusqueda('');
                                            }}
                                        >
                                            Limpiar filtros
                                        </button>
                                    </div>
                                ) : (
                                    mesasFiltradas.map((mesa) => (
                                        <MesaCard key={mesa.id} mesa={mesa} />
                                    ))
                                )}
                            </div>
                        )}

                        {/* Vista Tabla */}
                        {vista === 'lista' && (
                            <div className="table-container">
                                <table className="mesas-table">
                                    <thead>
                                        <tr>
                                            <th>Mesa</th>
                                            <th>Ubicación</th>
                                            <th>Capacidad</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mesasFiltradas.map((mesa) => {
                                            const estadoInfo = getEstadoInfo(mesa.estado);
                                            const EstadoIcon = estadoInfo.icon;
                                            
                                            return (
                                                <tr key={mesa.id} className="mesa-row">
                                                    <td>
                                                        <div className="mesa-numero-tabla">
                                                            <strong>#{mesa.numero}</strong>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="ubicacion-cell">
                                                            <MapPin size={14} />
                                                            <span>{mesa.ubicacion}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="capacidad-cell">
                                                            <Users size={14} />
                                                            <span>{mesa.capacidad} personas</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div 
                                                            className="estado-badge-tabla"
                                                            style={{ 
                                                                backgroundColor: estadoInfo.bgColor,
                                                                color: estadoInfo.textColor
                                                            }}
                                                        >
                                                            <EstadoIcon size={12} />
                                                            <span>{estadoInfo.label}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="acciones-tabla">
                                                            <button
                                                                className="btn-action btn-view"
                                                                onClick={() => navegarDetalle(mesa.id)}
                                                                title="Ver detalle"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                className="btn-action btn-edit"
                                                                onClick={() => navegarEditar(mesa.id)}
                                                                title="Editar mesa"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                className="btn-action btn-delete"
                                                                onClick={() => eliminarMesa(mesa)}
                                                                title="Eliminar mesa"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ListMesaComponent;