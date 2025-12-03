import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import AuthService from '../services/AuthService';
import { listEmpleados, deleteEmpleado } from "../services/EmpleadoService"; 
import { 
    User, Plus, Edit, Trash2, Eye, Briefcase,
    UserCheck, UserX, Users, Search, Filter,
    AlertCircle, Phone, Mail, Calendar, KeyRound
} from "lucide-react";

export const ListEmpleadoComponent = () => {
    // Clientes contiene la lista YA FILTRADA por el backend
    const [empleados, setEmpleados] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroTexto, setFiltroTexto] = useState(''); // El texto que se está escribiendo
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [filtroPuesto, setFiltroPuesto] = useState('TODOS');
    const navigate = useNavigate();

    // 💡 ESTADOS QUE ALMACENAN EL ÚLTIMO FILTRO ENVIADO AL BACKEND
    const [ultimaBusqueda, setUltimaBusqueda] = useState('');
    const [ultimoEstado, setUltimoEstado] = useState('TODOS');
    const [ultimoPuesto, setUltimoPuesto] = useState('TODOS');
    
    
    // ==========================================================
    // 💡 FUNCIONES DE ESTILO Y ESTADO (MOVIDAS AL CUERPO PRINCIPAL)
    // ==========================================================

    const getEstadoInfo = (estado) => {
        const estados = {
            'ACTIVO': { 
                color: 'success', 
                label: 'Activo', 
                icon: UserCheck,
                bgColor: '#d1fae5',
                textColor: '#065f46'
            },
            'INACTIVO': { 
                color: 'secondary', 
                label: 'Inactivo', 
                icon: UserX,
                bgColor: '#e5e7eb',
                textColor: '#374151'
            }
        };
        return estados[estado] || { color: 'light', label: estado, icon: User };
    };

    const getPuestoInfo = (puesto) => {
        const puestos = {
            'GERENTE': { color: 'primary', icon: Briefcase, bgColor: '#dbeafe', textColor: '#1e40af' },
            'SUPERVISOR': { color: 'info', icon: UserCheck, bgColor: '#d1f5f3', textColor: '#0e7490' },
            'CHEF': { color: 'warning', icon: Briefcase, bgColor: '#fef3c7', textColor: '#92400e' },
            'MESERO': { color: 'success', icon: User, bgColor: '#d1fae5', textColor: '#065f46' },
            'BARTENDER': { color: 'info', icon: Briefcase, bgColor: '#e0f2fe', textColor: '#0369a1' },
            'CAJERO': { color: 'orange', icon: User, bgColor: '#ffedd5', textColor: '#9a3412' },
            'AYUDANTE': { color: 'secondary', icon: User, bgColor: '#f3f4f6', textColor: '#4b5563' }
        };
        return puestos[puesto] || { color: 'light', icon: User, bgColor: '#f9fafb', textColor: '#6b7280' };
    };
    
    // --- LÓGICA DE CARGA CENTRALIZADA ---
    const cargarEmpleados = (filtroTxt, estado, puesto) => {
        setLoading(true);
        listEmpleados(filtroTxt, estado, puesto) 
            .then((response) => {
                setEmpleados(response.data || []);
                setError(null);
                setUltimaBusqueda(filtroTxt);
                setUltimoEstado(estado);
                setUltimoPuesto(puesto);
            })
            .catch((error) => {
                console.error("Error al cargar empleados:", error);
                setError("No se pudieron cargar los empleados.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // 💡 Efecto Inicial: Carga TODOS los empleados
    useEffect(() => {
        cargarEmpleados('', 'TODOS', 'TODOS');
    }, []);

    // 💡 Handlers de búsqueda y filtro
    const handleSearch = () => {
        cargarEmpleados(filtroTexto, filtroEstado, filtroPuesto);
    };

    const handleClear = () => {
        setFiltroTexto('');
        setFiltroEstado('TODOS');
        setFiltroPuesto('TODOS');
        cargarEmpleados('', 'TODOS', 'TODOS');
    };

    // --- Funciones auxiliares para estilos y acciones (se mantienen) ---
    const navegarCrear = () => navigate('/empleado/crear');
    const navegarEditar = (id) => navigate(`/empleado/editar/${id}`);
    const navegarDetalle = (id) => navigate(`/empleado/detalle/${id}`);
    
    const eliminarEmpleado = (empleado) => { 
        // Lógica de SweetAlert2 para eliminar
        Swal.fire({
            title: `¿Eliminar Empleado?`,
            html: `
                <div class="text-start">
                    <p>¿Estás seguro de eliminar a <strong>${empleado.nombre}</strong>?</p>
                    <div class="alert alert-warning mt-2">
                        <small>
                            <strong>Puesto:</strong> ${empleado.puesto}<br/>
                            <strong>Estado:</strong> ${empleado.estado}
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
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return deleteEmpleado(empleado.id)
                    .catch(error => {
                        Swal.showValidationMessage(
                            `Error: ${error.response?.data?.message || 'No se pudo eliminar el empleado'}`
                        );
                    });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: '¡Eliminado!',
                    text: 'El empleado ha sido eliminado exitosamente.',
                    icon: 'success',
                    confirmButtonColor: '#3E6770'
                });
                cargarEmpleados(ultimaBusqueda, ultimoEstado, ultimoPuesto); // Recargar con el filtro activo
            }
        });
    }; 

    const handleResetPassword = (empleado) => {
        Swal.fire({
            title: `¿Resetear contraseña?`,
            html: `
                <p>Estás a punto de generar una nueva contraseña temporal para:</p>
                <strong class="text-primary fs-5">${empleado.nombre}</strong>
                <p class="small text-muted">(Username: ${empleado.username})</p>
                <p class="text-danger mt-3">El empleado deberá usar la nueva contraseña para iniciar sesión.</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, Resetear',
            confirmButtonColor: '#3E6770',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Llama al AuthService con el USERNAME del empleado
                    const response = await AuthService.resetPassword(empleado.username);
                    
                    // Muestra la nueva contraseña temporal
                    await Swal.fire({
                        title: '¡Éxito!',
                        icon: 'success',
                        html: `
                            <p>Se ha reseteado la contraseña para <strong>${response.data.username}</strong>.</p>
                            <p class="mb-0">La nueva contraseña temporal es:</p>
                            <h4 class="text-primary fw-bold mt-2">${response.data.temporaryPassword}</h4>
                            <small class="text-muted">Por favor, entrega esta contraseña al empleado.</small>
                        `,
                        confirmButtonColor: '#3E6770'
                    });

                } catch (error) {
                    console.error("Error al resetear la contraseña:", error);
                    const msg = error.response?.data || "No se pudo resetear la contraseña.";
                    Swal.fire('Error', msg, 'error');
                }
            }
        });
    };


    // Estadísticas y puestos únicos (basado en la lista completa cargada)
    const estadisticas = {
        total: empleados.length,
        activos: empleados.filter(e => e.estado === 'ACTIVO').length,
        inactivos: empleados.filter(e => e.estado === 'INACTIVO').length
    };
    // 💡 Generar puestos únicos de la lista actual (empleados)
    const puestosUnicos = [...new Set(empleados.map(e => e.puesto))];
    
    // Función de Card
    const EmpleadoCard = ({ empleado }) => {
        // 💡 Ahora estas funciones están disponibles
        const estadoInfo = getEstadoInfo(empleado.estado);
        const puestoInfo = getPuestoInfo(empleado.puesto);
        const EstadoIcon = estadoInfo.icon;
        const PuestoIcon = puestoInfo.icon;

        return (
            <div className="empleado-card">
                <div className="empleado-header">
                    <div className="empleado-avatar"><User size={24} /></div>
                    <div className="empleado-info">
                        <h3 className="empleado-nombre">{empleado.nombre}</h3>
                        <div className="empleado-puesto-badge" style={{ backgroundColor: puestoInfo.bgColor, color: puestoInfo.textColor }}>
                            <PuestoIcon size={12} /><span>{empleado.puesto}</span>
                        </div>
                    </div>
                    <div className="empleado-estado" style={{ backgroundColor: estadoInfo.bgColor, color: estadoInfo.textColor }}>
                        <EstadoIcon size={12} /><span>{estadoInfo.label}</span>
                    </div>
                </div>
                <div className="empleado-actions">
                    <button className="btn-action btn-view" onClick={() => navegarDetalle(empleado.id)} title="Ver detalle"><Eye size={16} /></button>
                    <button className="btn-action btn-edit" onClick={() => navegarEditar(empleado.id)} title="Editar empleado"><Edit size={16} /></button>
                    <button 
                        className="btn-action btn-reset" // (Puedes darle un estilo 'btn-reset' en tu CSS)
                        onClick={() => handleResetPassword(empleado)} 
                        title="Resetear contraseña">
                        <KeyRound size={16} />
                    </button>
                    <button className="btn-action btn-delete" onClick={() => eliminarEmpleado(empleado)} title="Eliminar empleado"><Trash2 size={16} /></button>
                </div>
            </div>
        );
    };

    // Estados de carga
    if (loading) {
        return (
            <div className="page-wrap">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3 text-muted">Cargando empleados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-wrap">
                <div className="alert alert-danger text-center">
                    <strong>Error:</strong> {error}
                    <button 
                        className="btn btn-sm btn-outline-danger ms-2"
                        onClick={() => cargarEmpleados('', 'TODOS', 'TODOS')} 
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }
    
    // Se usa 'empleados.length' para saber cuántos se muestran
    const totalEmpleadosMostrados = empleados.length;
    const isFiltroActivo = ultimaBusqueda || ultimoEstado !== 'TODOS' || ultimoPuesto !== 'TODOS';

    return (
        <div className="page-wrap">
            <div className="container-fluid">
                {/* Header mejorado */}
                <div className="restaurant-header">
                    <div className="header-content">
                        <div className="header-title">
                            <Users size={32} className="header-icon" />
                            <div>
                                <h1>Gestión de Empleados</h1>
                                <p>Administra el personal y equipo de trabajo del restaurante</p>
                            </div>
                        </div>
                        <button className="btn-primary btn-lg" onClick={navegarCrear}>
                            <Plus size={20} className="me-2"/>
                            Nuevo Empleado
                        </button>
                    </div>
                </div>

                {/* Panel de Estadísticas Mejorado (simplificado para el listado) */}
                <div className="stats-panel">
                    <div className="stat-card total">
                        <div className="stat-icon"><Users size={24} /></div>
                        <div className="stat-info">
                            <h3>{estadisticas.total}</h3>
                            <span>Total Empleados</span>
                        </div>
                    </div>
                    <div className="stat-card active">
                        <div className="stat-icon"><UserCheck size={24} /></div>
                        <div className="stat-info">
                            <h3>{estadisticas.activos}</h3>
                            <span>Activos</span>
                        </div>
                    </div>
                    <div className="stat-card inactive">
                        <div className="stat-icon"><UserX size={24} /></div>
                        <div className="stat-info">
                            <h3>{estadisticas.inactivos}</h3>
                            <span>Inactivos</span>
                        </div>
                    </div>
                </div>

                {/* Controles de Filtro */}
                <div className="controls-panel">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o puesto..."
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                            className="search-input"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} // Buscar al presionar Enter
                        />
                    </div>
                    
                    <div className="filters">
                        <Filter size={18} />
                        <select 
                            value={filtroEstado} 
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="filter-select"
                        >
                            <option value="TODOS">Todos los estados</option>
                            <option value="ACTIVO">Activos</option>
                            <option value="INACTIVO">Inactivos</option>
                        </select>
                        
                        <select 
                            value={filtroPuesto} 
                            onChange={(e) => setFiltroPuesto(e.target.value)}
                            className="filter-select"
                        >
                            <option value="TODOS">Todos los puestos</option>
                            {puestosUnicos.map(puesto => (
                                <option key={puesto} value={puesto}>{puesto}</option>
                            ))}
                        </select>
                        
                        <button className="btn-search" onClick={handleSearch}>
                            Buscar
                        </button>
                        <button className="btn-clear" onClick={handleClear} disabled={!isFiltroActivo}>
                            Limpiar
                        </button>
                    </div>
                    
                    <div className="filter-info">
                        <span className="text-muted small">
                            Mostrando {totalEmpleadosMostrados} empleados
                            {isFiltroActivo && (
                                <span className="ms-2 badge bg-primary">
                                    Filtro Activo
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Contenido Principal */}
                <div className="empleados-grid">
                    {totalEmpleadosMostrados === 0 && !isFiltroActivo ? (
                        <div className="empty-state">
                            <Users size={64} className="empty-icon" />
                            <h3>No hay empleados registrados</h3>
                            <p>Comienza agregando tu primer empleado al sistema.</p>
                            <button className="btn-primary mt-3" onClick={navegarCrear}>
                                <Plus size={16} className="me-2" /> Agregar Primer Empleado
                            </button>
                        </div>
                    ) : totalEmpleadosMostrados === 0 && isFiltroActivo ? (
                        <div className="empty-state">
                            <Users size={64} className="empty-icon" />
                            <h3>No se encontraron empleados</h3>
                            <p>No hay empleados que coincidan con los filtros aplicados.</p>
                            <button className="btn-outline-primary mt-3" onClick={handleClear}>
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        empleados.map((empleado) => (
                            <EmpleadoCard key={empleado.id} empleado={empleado} />
                        ))
                    )}
                </div>

                {/* Distribución por Puesto (Solo si hay empleados sin filtrar) */}
                {!isFiltroActivo && empleados.length > 0 && (
                    <div className="distribution-panel mt-5">
                        <div className="panel-header">
                            <Briefcase size={24} className="me-2" />
                            <h3>Distribución por Puesto</h3>
                        </div>
                        <div className="distribution-grid">
                            {puestosUnicos.map(puesto => {
                                const cantidad = empleados.filter(e => e.puesto === puesto).length;
                                const porcentaje = (cantidad / empleados.length) * 100;
                                const puestoInfo = getPuestoInfo(puesto);
                                
                                return (
                                    <div key={puesto} className="distribution-item">
                                        <div className="distribution-header">
                                            <div className="puesto-badge" style={{ backgroundColor: puestoInfo.bgColor, color: puestoInfo.textColor }}>
                                                <Briefcase size={12} className="me-1" />
                                                {puesto}
                                            </div>
                                            <span className="distribution-count">{cantidad}</span>
                                        </div>
                                        <div className="distribution-bar">
                                            <div className="distribution-fill"
                                                style={{
                                                    width: `${porcentaje}%`,
                                                    backgroundColor: puestoInfo.textColor
                                                }}
                                            ></div>
                                        </div>
                                        <div className="distribution-percentage">
                                            {porcentaje.toFixed(1)}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListEmpleadoComponent;