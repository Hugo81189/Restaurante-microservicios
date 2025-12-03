import React, { useEffect, useState } from "react";
import { listTipos, deleteTipo } from "../services/TipoService"; 
import { useNavigate } from "react-router-dom";
import { TipoCard } from "./TipoCard.jsx";
import Swal from 'sweetalert2';
import { 
    Plus, Tag, Layers, Package, AlertCircle, 
    Search, Filter, SortAsc, SortDesc 
} from "lucide-react";

export const ListTipoProductoComponent = () => {
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroActivo, setFiltroActivo] = useState('TODOS');
    const [ordenarPor, setOrdenarPor] = useState('nombre');
    const [ordenAscendente, setOrdenAscendente] = useState(true);
    const navegar = useNavigate();

    const cargarTipos = () => {
        setLoading(true);
        listTipos()
            .then((res) => {
                setTipos(res?.data || []); 
                setError(null);
            })
            .catch((error) => {
                console.error("Error al cargar tipos:", error);
                setError("No se pudieron cargar los tipos de productos. Intente de nuevo.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        cargarTipos();
    }, []);

    // Filtros y ordenamiento
    const tiposFiltrados = tipos.filter(tipo => {
        const coincideBusqueda = tipo.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                               tipo.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideFiltro = filtroActivo === 'TODOS' || tipo.estado === filtroActivo;
        
        return coincideBusqueda && coincideFiltro;
    });

    const tiposOrdenados = [...tiposFiltrados].sort((a, b) => {
        let comparacion = 0;
        
        switch (ordenarPor) {
            case 'nombre':
                comparacion = a.nombre?.localeCompare(b.nombre);
                break;
            case 'productos':
                // Asumiendo que tienes un campo cantidadProductos
                comparacion = (a.cantidadProductos || 0) - (b.cantidadProductos || 0);
                break;
            case 'fecha':
                comparacion = new Date(a.fechaCreacion) - new Date(b.fechaCreacion);
                break;
            default:
                comparacion = 0;
        }
        
        return ordenAscendente ? comparacion : -comparacion;
    });

    // Navegación
    const navegarCrear = () => navegar('/tipo/crear'); 
    const actualizarTipo = (id) => navegar(`/tipo/editar/${id}`);

    // Eliminación con mejor manejo de errores
    const eliminarTipo = (tipo) => {
        Swal.fire({
            title: `¿Eliminar "${tipo.nombre}"?`,
            html: `
                <div class="text-start">
                    <p>¿Estás seguro de eliminar este tipo de producto?</p>
                    <div class="alert alert-warning mt-2">
                        <small>
                            <strong>Nombre:</strong> ${tipo.nombre}<br/>
                            ${tipo.descripcion ? `<strong>Descripción:</strong> ${tipo.descripcion}<br/>` : ''}
                            <strong>Productos asociados:</strong> ${tipo.cantidadProductos || 0}
                        </small>
                    </div>
                    <p class="text-danger mt-2">
                        <small>
                            <strong>Advertencia:</strong> No podrás eliminar tipos que tengan productos asociados.
                        </small>
                    </p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#3E6770',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteTipo(tipo.id)
                    .then(() => {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'El tipo de producto ha sido eliminado exitosamente.',
                            icon: 'success',
                            confirmButtonColor: '#3E6770'
                        });
                        cargarTipos();
                    })
                    .catch(error => {
                        console.error("Error al eliminar tipo:", error);
                        const errorMsg = error.response?.data?.message || 
                                       "No se pudo eliminar el tipo. Asegúrate de que no tenga productos asociados.";
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
        total: tipos.length,
        activos: tipos.filter(t => t.estado === 'ACTIVO').length,
        inactivos: tipos.filter(t => t.estado === 'INACTIVO').length,
        conProductos: tipos.filter(t => (t.cantidadProductos || 0) > 0).length
    };

    return (
        <div className="page-wrap">
            <div className="container-fluid">
                {/* Header Mejorado */}
                <div className="restaurant-header">
                    <div className="header-content">
                        <div className="header-title">
                            <Tag size={32} className="header-icon" />
                            <div>
                                <h1>Tipos de Producto</h1>
                                <p>Organiza y clasifica los artículos de tu menú</p>
                            </div>
                        </div>
                        <button className="btn-primary btn-lg" onClick={navegarCrear}>
                            <Plus size={20} className="me-2"/>
                            Nuevo Tipo
                        </button>
                    </div>
                </div>

                {/* Panel de Estadísticas */}
                <div className="stats-panel">
                    <div className="stat-card total">
                        <div className="stat-icon">
                            <Layers size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{estadisticas.total}</h3>
                            <span>Total Tipos</span>
                        </div>
                    </div>
                    <div className="stat-card active">
                        <div className="stat-icon">
                            <Package size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{estadisticas.activos}</h3>
                            <span>Activos</span>
                        </div>
                    </div>
                    <div className="stat-card with-products">
                        <div className="stat-icon">
                            <Tag size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{estadisticas.conProductos}</h3>
                            <span>Con Productos</span>
                        </div>
                    </div>
                    <div className="stat-card inactive">
                        <div className="stat-icon">
                            <AlertCircle size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{estadisticas.inactivos}</h3>
                            <span>Inactivos</span>
                        </div>
                    </div>
                </div>

                {/* Controles de Filtro y Búsqueda */}
                <div className="controls-panel">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o descripción..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    
                    <div className="filters">
                        <Filter size={18} />
                        <select 
                            value={filtroActivo} 
                            onChange={(e) => setFiltroActivo(e.target.value)}
                            className="filter-select"
                        >
                            <option value="TODOS">Todos los estados</option>
                            <option value="ACTIVO">Activos</option>
                            <option value="INACTIVO">Inactivos</option>
                        </select>
                    </div>

                    <div className="sort-controls">
                        <select 
                            value={ordenarPor} 
                            onChange={(e) => setOrdenarPor(e.target.value)}
                            className="sort-select"
                        >
                            <option value="nombre">Ordenar por nombre</option>
                            <option value="productos">Ordenar por productos</option>
                            <option value="fecha">Ordenar por fecha</option>
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

                {/* Información de Filtros */}
                <div className="filter-info">
                    <span className="text-muted small">
                        Mostrando {tiposOrdenados.length} de {tipos.length} tipos
                        {busqueda && ` • Filtrado por: "${busqueda}"`}
                    </span>
                </div>

                {/* Contenido Principal */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Cargando tipos de producto...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <AlertCircle size={48} className="error-icon" />
                        <h3>Error al cargar los tipos</h3>
                        <p>{error}</p>
                        <button className="btn-retry" onClick={cargarTipos}>
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <div className="tipos-grid">
                        {tiposOrdenados.length === 0 ? (
                            <div className="empty-state">
                                <Tag size={64} className="empty-icon" />
                                <h3>No se encontraron tipos</h3>
                                <p>
                                    {busqueda || filtroActivo !== 'TODOS' 
                                        ? "No hay tipos que coincidan con los filtros aplicados."
                                        : "No hay tipos de productos registrados."
                                    }
                                </p>
                                {(busqueda || filtroActivo !== 'TODOS') ? (
                                    <button 
                                        className="btn-clear-filters"
                                        onClick={() => {
                                            setBusqueda('');
                                            setFiltroActivo('TODOS');
                                        }}
                                    >
                                        Limpiar filtros
                                    </button>
                                ) : (
                                    <button 
                                        className="btn-primary mt-3"
                                        onClick={navegarCrear}
                                    >
                                        <Plus size={16} className="me-2" />
                                        Crear Primer Tipo
                                    </button>
                                )}
                            </div>
                        ) : (
                            tiposOrdenados.map((tipo) => (
                                <TipoCard
                                    key={tipo.id}
                                    tipo={tipo}
                                    onEdit={actualizarTipo}
                                    onDelete={eliminarTipo}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};