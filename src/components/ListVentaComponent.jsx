import React, { useEffect, useState, useMemo } from "react";
// 💡 listVentas ahora acepta todos los parámetros
import { listVentas, deleteVenta } from "../services/VentaService"; 
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import {
    ShoppingCart, Plus, Eye, Trash2, CheckCircle, Clock, Ban,
    DollarSign, Calendar, User, Edit, Search, Filter, TrendingUp,
    Package, RefreshCw, ChevronDown, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight
} from "lucide-react";

export const ListVentaComponent = () => {
    // Clientes contiene la lista YA FILTRADA y ordenada por el backend
    const [ventas, setVentas] = useState([]); 
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE FILTRO/BÚSQUEDA ---
    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODAS');
    const [fechaExacta, setFechaExacta] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // --- ESTADOS DE ORDENAMIENTO ---
    const [ordenarPor, setOrdenarPor] = useState('fecha');
    const [ordenAscendente, setOrdenAscendente] = useState(false);
    
    // --- ESTADOS DE PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(1);
    const [elementosPorPagina, setElementosPorPagina] = useState(10); // <--- Variable declarada
    const [ventaExpandida, setVentaExpandida] = useState(null);
    const navegar = useNavigate();

    // Función de cálculo (se mantiene robusta)
    const calcularTotalVenta = (detalles) => {
        if (!detalles || detalles.length === 0) return 0;
        return detalles.reduce((totalAcumulado, detalle) => {
            // Aseguramos conversión segura de strings a números
            const precio = parseFloat(detalle.precioUnitario) || 0;
            const cantidad = parseFloat(detalle.cantidad) || 0;
            return totalAcumulado + (precio * cantidad);
        }, 0);
    };

    const formatPrice = (price) => {
        const numericPrice = typeof price === 'number' ? price : 0;
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(numericPrice);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusInfo = (venta) => {
        const estados = {
            'FINALIZADO': { label: 'Finalizada', color: '#10b981', bgColor: '#d1fae5', icon: CheckCircle, canEdit: false, canDelete: false },
            'PENDIENTE': { label: 'Pendiente', color: '#3b82f6', bgColor: '#dbeafe', icon: Clock, canEdit: true, canDelete: true },
            'CANCELADO': { label: 'Cancelada', color: '#6b7280', bgColor: '#e5e7eb', icon: Ban, canEdit: false, canDelete: false }
        };
        return estados[venta.statusOrden] || estados['PENDIENTE'];
    };

    // 💡 FUNCIÓN PRINCIPAL DE CARGA Y FILTRADO (Llama al backend)
    function cargarVentas(nombre, estado, exact, inicio, fin, ordenar, asc) {
        setLoading(true);
        listVentas(nombre, estado, exact, inicio, fin, ordenar, asc)
            .then((response) => {
                setVentas(response.data || []);
                setError(null);
            })
            .catch((e) => {
                console.error("Error al cargar ventas:", e);
                setError("No se pudieron cargar las ventas. Intente de nuevo.");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    // 💡 Handlers de Botones
    const handleSearch = () => {
        // Disparar la búsqueda
        cargarVentas(filtroNombre, filtroEstado, fechaExacta, fechaInicio, fechaFin, ordenarPor, ordenAscendente);
    };

    const handleClearFilters = () => {
        setFiltroNombre('');
        setFiltroEstado('TODAS');
        setFechaExacta('');
        setFechaInicio('');
        setFechaFin('');
        // Recargar con solo ordenamiento
        cargarVentas('', 'TODAS', '', '', '', ordenarPor, ordenAscendente); 
    };
    
    // 💡 Efectos para cargar datos y recargar en cambios de orden/paginación
    useEffect(() => {
        // Carga inicial y recarga si cambia el orden
        cargarVentas(filtroNombre, filtroEstado, fechaExacta, fechaInicio, fechaFin, ordenarPor, ordenAscendente);
    }, [ordenarPor, ordenAscendente]); 

    // Resetear a página 1 cuando cambien los filtros de contenido (se recarga en el hook siguiente)
    useEffect(() => {
        setPaginaActual(1);
        // Volver a cargar si cambian los filtros de contenido
        if (filtroNombre || filtroEstado !== 'TODAS' || fechaExacta || fechaInicio || fechaFin) {
            cargarVentas(filtroNombre, filtroEstado, fechaExacta, fechaInicio, fechaFin, ordenarPor, ordenAscendente);
        } else {
            // Recargar si los filtros se limpian y el orden se mantiene
            cargarVentas('', 'TODAS', '', '', '', ordenarPor, ordenAscendente);
        }
    }, [filtroNombre, filtroEstado, fechaExacta, fechaInicio, fechaFin]);


    // 💡 CÁLCULOS DE PAGINACIÓN (Ahora usa 'ventas' directamente)
    const ventasOrdenadas = ventas; 
    
    const totalPaginas = Math.ceil(ventasOrdenadas.length / elementosPorPagina);
    const inicio = (paginaActual - 1) * elementosPorPagina;
    
    // ✅ CORRECCIÓN FINAL: Usar el nombre correcto de la variable
    const fin = inicio + elementosPorPagina; 
    
    const ventasPaginadas = ventasOrdenadas.slice(inicio, fin);

    // 💡 FUNCIONES DE PAGINACIÓN
    const irAPagina = (pagina) => { setPaginaActual(pagina); setVentaExpandida(null); };
    const irAPaginaAnterior = () => { if (paginaActual > 1) { setPaginaActual(paginaActual - 1); setVentaExpandida(null); } };
    const irAPaginaSiguiente = () => { if (paginaActual < totalPaginas) { setPaginaActual(paginaActual + 1); setVentaExpandida(null); } };
    const irAPrimeraPagina = () => { setPaginaActual(1); setVentaExpandida(null); };
    const irAUltimaPagina = () => { setPaginaActual(totalPaginas); setVentaExpandida(null); };
    
    // 💡 GENERAR RANGO DE PÁGINAS PARA MOSTRAR
    const obtenerRangoPaginas = () => {
        const paginas = [];
        const paginasAMostrar = 5; 
        
        let inicioRango = Math.max(1, paginaActual - Math.floor(paginasAMostrar / 2));
        let finRango = Math.min(totalPaginas, inicioRango + paginasAMostrar - 1);
        
        if (finRango - inicioRango + 1 < paginasAMostrar) {
            inicioRango = Math.max(1, finRango - paginasAMostrar + 1);
        }
        
        for (let i = inicioRango; i <= finRango; i++) {
            paginas.push(i);
        }
        
        return paginas;
    };
    

    const navegarCrear = () => navegar('/venta/crear');
    const verDetalle = (id) => navegar(`/venta/detalle/${id}`);
    const editarVenta = (id) => navegar(`/venta/editar/${id}`);

    // Lógica de cancelación (mantener igual)
    const cancelarVenta = (venta) => { 
        const statusInfo = getStatusInfo(venta);

        if (!statusInfo.canDelete) {
            Swal.fire({
                title: "Acción No Permitida",
                text: `No se puede cancelar una venta con estado "${statusInfo.label}".`,
                icon: "warning",
                confirmButtonColor: '#3E6770'
            });
            return;
        }

        Swal.fire({
            title: "¿Confirmar Cancelación?",
            html: `
                <div class="text-start">
                    <p>¿Estás seguro de cancelar la venta <strong>#${venta.id}</strong>?</p>
                    <div class="alert alert-warning mt-2">
                        <small>
                            <strong>Cliente:</strong> ${venta.nombreCliente || 'N/A'}<br/>
                            <strong>Total:</strong> ${formatPrice(calcularTotalVenta(venta.detalles))}
                        </small>
                    </div>
                    <p class="text-danger mt-2"><small>Esta acción no se puede deshacer.</small></p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#3E6770',
            confirmButtonText: 'Sí, CANCELAR VENTA',
            cancelButtonText: 'No, mantener'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteVenta(venta.id)
                    .then(() => {
                        Swal.fire({
                            title: '¡Cancelada!',
                            text: 'La venta ha sido cancelada exitosamente.',
                            icon: 'success',
                            confirmButtonColor: '#3E6770'
                        });
                        cargarVentas(filtroNombre, filtroEstado, fechaExacta, fechaInicio, fechaFin, ordenarPor, ordenAscendente); // Recargar
                    })
                    .catch(e => {
                        console.error("Error al cancelar la venta:", e);
                        const errorMsg = e.response?.data || "Error al cancelar la venta.";
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
        total: ventas.length,
        finalizadas: ventas.filter(v => v.statusOrden === 'FINALIZADO').length,
        pendientes: ventas.filter(v => v.statusOrden === 'PENDIENTE' || !v.statusOrden).length,
        canceladas: ventas.filter(v => v.statusOrden === 'CANCELADO').length,
        totalIngresos: ventas
            .filter(v => v.statusOrden === 'FINALIZADO')
            .reduce((sum, v) => sum + calcularTotalVenta(v.detalles), 0)
    };

    // Componente Tarjeta de Venta (mantener igual)
    const VentaCard = ({ venta }) => {
        const statusInfo = getStatusInfo(venta);
        const StatusIcon = statusInfo.icon;
        const totalProductos = venta.detalles?.reduce((sum, detalle) => sum + (detalle.cantidad || 0), 0) || 0;
        const totalVenta = calcularTotalVenta(venta.detalles);
        const estaExpandida = ventaExpandida === venta.id;

        const handleExpandClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            setVentaExpandida(estaExpandida ? null : venta.id);
        };

        const handleActionClick = (action) => (e) => {
            e.stopPropagation();
            action();
        };

        return (
            <div className="venta-card">
                <div className="venta-header">
                    <div className="venta-info-principal">
                        <div className="venta-id-cliente">
                            <div className="venta-id">
                                <strong>#{venta.id}</strong>
                            </div>
                            <div className="venta-cliente">
                                <User size={16} />
                                <span>{venta.nombreCliente || 'Cliente no especificado'}</span>
                            </div>
                        </div>
                        <div className="venta-fecha-total">
                            <div className="venta-fecha">
                                <Calendar size={14} />
                                <span>{formatDate(venta.fecha)}</span>
                            </div>
                            <div className="venta-total">
                                <DollarSign size={14} />
                                <strong>{formatPrice(totalVenta)}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="venta-estado-productos">
                        <div 
                            className="venta-estado"
                            style={{
                                backgroundColor: statusInfo.bgColor,
                                color: statusInfo.color
                            }}
                        >
                            <StatusIcon size={14} />
                            <span>{statusInfo.label}</span>
                        </div>
                        <div className="venta-productos">
                            <Package size={14} />
                            <span>{totalProductos} producto{totalProductos !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    <button
                        className="btn-expand"
                        onClick={handleExpandClick}
                        title={estaExpandida ? "Contraer detalles" : "Expandir detalles"}
                    >
                        <ChevronDown size={16} className={estaExpandida ? 'expanded' : ''} />
                    </button>
                </div>

                {estaExpandida && (
                    <div className="venta-detalles">
                        <div className="detalle-seccion">
                            <h6>Detalles de Productos</h6>
                            <div className="productos-lista">
                                {venta.detalles?.map((detalle, index) => (
                                    <div key={index} className="producto-item">
                                        <div className="producto-info">
                                            <span className="producto-nombre">{detalle.nombreProducto || 'Producto'}</span>
                                            <span className="producto-precio">
                                                {formatPrice(detalle.precioUnitario)} x {detalle.cantidad}
                                            </span>
                                        </div>
                                        <div className="producto-subtotal">
                                            {formatPrice((detalle.precioUnitario || 0) * (detalle.cantidad || 0))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="venta-actions">
                            <button
                                className="btn-action btn-view"
                                onClick={handleActionClick(() => verDetalle(venta.id))}
                                title="Ver detalle completo"
                            >
                                <Eye size={16} />
                                <span>Detalles</span>
                            </button>

                            {statusInfo.canEdit && (
                                <button
                                    className="btn-action btn-edit"
                                    onClick={handleActionClick(() => editarVenta(venta.id))}
                                    title="Editar venta"
                                >
                                    <Edit size={16} />
                                    <span>Editar</span>
                                </button>
                            )}

                            {statusInfo.canDelete && (
                                <button
                                    className="btn-action btn-delete"
                                    onClick={handleActionClick(() => cancelarVenta(venta))}
                                    title="Cancelar venta"
                                >
                                    <Trash2 size={16} />
                                    <span>Cancelar</span>
                                </button>
                            )}

                            {!statusInfo.canEdit && !statusInfo.canDelete && (
                                <span className="btn-action btn-disabled" title="No editable">
                                    <Ban size={16} />
                                    <span>No editable</span>
                                </span>
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
                            <ShoppingCart size={32} className="header-icon" />
                            <div>
                                <h1>Gestión de Ventas</h1>
                                <p>Administra y monitorea todas las transacciones del sistema</p>
                            </div>
                        </div>
                        <button className="btn-primary btn-lg" onClick={navegarCrear}>
                            <Plus size={20} className="me-2"/>
                            Nueva Venta
                        </button>
                    </div>
                </div>

                {/* Panel de Estadísticas Mejorado */}
                <div className="stats-panel">
                    <div className="stat-card total">
                        <div className="stat-icon"><ShoppingCart size={24} /></div>
                        <div className="stat-info">
                            <h3>{estadisticas.total}</h3>
                            <span>Total Ventas</span>
                        </div>
                    </div>
                    <div className="stat-card completed">
                        <div className="stat-icon"><CheckCircle size={24} /></div>
                        <div className="stat-info">
                            <h3>{estadisticas.finalizadas}</h3>
                            <span>Finalizadas</span>
                        </div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-icon"><Clock size={24} /></div>
                        <div className="stat-info">
                            <h3>{estadisticas.pendientes}</h3>
                            <span>Pendientes</span>
                        </div>
                    </div>
                    <div className="stat-card revenue">
                        <div className="stat-icon"><TrendingUp size={24} /></div>
                        <div className="stat-info">
                            <h3>{formatPrice(estadisticas.totalIngresos)}</h3>
                            <span>Ingresos Totales</span>
                        </div>
                    </div>
                </div>

                {/* Controles de Filtro y Ordenamiento */}
                <div className="controls-panel">
                    <div className="row g-3 align-items-end w-100 mx-auto">
                        
                        {/* Filtro por Nombre */}
                        <div className="col-md-3">
                            <label htmlFor="filtroNombre" className="form-label-sm">Buscar Cliente</label>
                            <div className="search-box">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    id="filtroNombre"
                                    placeholder="Nombre de cliente..."
                                    value={filtroNombre}
                                    onChange={(e) => setFiltroNombre(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>

                        {/* Filtro por Estado */}
                        <div className="col-md-2">
                            <label htmlFor="filtroEstado" className="form-label-sm">Estado</label>
                            <select 
                                id="filtroEstado"
                                value={filtroEstado} 
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="form-select"
                            >
                                <option value="TODAS">Todos</option>
                                <option value="PENDIENTE">Pendientes</option>
                                <option value="FINALIZADO">Finalizadas</option>
                                <option value="CANCELADO">Canceladas</option>
                            </select>
                        </div>
                        
                        {/* Filtro por Fecha Exacta */}
                        <div className="col-md-2">
                            <label htmlFor="fechaExacta" className="form-label-sm">Fecha Exacta</label>
                            <input
                                id="fechaExacta"
                                type="date"
                                value={fechaExacta}
                                onChange={(e) => setFechaExacta(e.target.value)}
                                className="form-control"
                            />
                        </div>
                        
                        {/* Botón de Búsqueda */}
                        <div className="col-md-2 d-flex gap-2">
                            <button
                                onClick={handleSearch}
                                className="btn btn-search w-100"
                            >
                                <Search size={16} className="me-2" /> Buscar
                            </button>
                        </div>

                        {/* Botón de Limpieza y Ordenamiento */}
                        <div className="col-md-3 d-flex gap-2">
                            <button
                                onClick={handleClearFilters}
                                className="btn btn-clear w-50"
                            >
                                Limpiar Filtros
                            </button>
                            <select 
                                value={ordenarPor} 
                                onChange={(e) => setOrdenarPor(e.target.value)}
                                className="form-select w-50"
                            >
                                <option value="fecha">Fecha</option>
                                <option value="total">Total</option>
                                <option value="cliente">Cliente</option>
                                <option value="estado">Estado</option>
                            </select>
                            <button
                                onClick={() => setOrdenAscendente(!ordenAscendente)}
                                className="btn btn-search w-25"
                                title="Cambiar orden"
                            >
                                {ordenAscendente ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Controles de Paginación Superior e Información */}
                <div className="pagination-controls-top">
                    <div className="pagination-info">
                        <span>
                            Mostrando <strong>{ventasPaginadas.length}</strong> de <strong>{ventasOrdenadas.length}</strong> ventas
                        </span>
                    </div>
                    
                    <div className="pagination-size-selector">
                        <label htmlFor="elementosPorPagina" className="form-label-sm">
                            Mostrar:
                        </label>
                        <select
                            id="elementosPorPagina"
                            value={elementosPorPagina}
                            onChange={(e) => setElementosPorPagina(Number(e.target.value))}
                            className="form-select-sm"
                        >
                            <option value={5}>5 por página</option>
                            <option value={10}>10 por página</option>
                            <option value={20}>20 por página</option>
                            <option value={50}>50 por página</option>
                        </select>
                    </div>
                </div>

                {/* Contenido Principal (Grid de Tarjetas de Venta) */}
                <div className="ventas-grid">
                    {ventasPaginadas.length === 0 ? (
                        <div className="empty-state">
                            <ShoppingCart size={64} className="empty-icon" />
                            <h3>No se encontraron ventas</h3>
                            <p>
                                {ventas.length === 0 
                                    ? "No hay ventas registradas en el sistema."
                                    : "No hay ventas que coincidan con los filtros aplicados."
                                }
                            </p>
                            {ventas.length === 0 && (
                                <button className="btn-primary mt-3" onClick={navegarCrear}>
                                    <Plus size={16} className="me-2" /> Crear Primera Venta
                                </button>
                            )}
                        </div>
                    ) : (
                        ventasPaginadas.map((venta) => (
                            <VentaCard key={venta.id} venta={venta} />
                        ))
                    )}
                </div>

                {/* 💡 PAGINACIÓN INFERIOR */}
                {totalPaginas > 1 && (
                    <div className="pagination-controls">
                        <div className="pagination-info">
                            Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
                            {` (${ventasOrdenadas.length} ventas)`}
                        </div>

                        <div className="pagination-buttons">
                            <button className="btn-pagination" onClick={irAPrimeraPagina} disabled={paginaActual === 1} title="Primera página">
                                <ChevronsLeft size={16} />
                            </button>

                            <button className="btn-pagination" onClick={irAPaginaAnterior} disabled={paginaActual === 1} title="Página anterior">
                                <ChevronLeft size={16} />
                            </button>

                            {obtenerRangoPaginas().map(pagina => (
                                <button key={pagina} className={`btn-pagination ${pagina === paginaActual ? 'active' : ''}`} onClick={() => irAPagina(pagina)}>
                                    {pagina}
                                </button>
                            ))}

                            {totalPaginas > obtenerRangoPaginas()[obtenerRangoPaginas().length - 1] && (<span className="pagination-ellipsis">...</span>)}

                            <button className="btn-pagination" onClick={irAPaginaSiguiente} disabled={paginaActual === totalPaginas} title="Página siguiente">
                                <ChevronRight size={16} />
                            </button>

                            <button className="btn-pagination" onClick={irAUltimaPagina} disabled={paginaActual === totalPaginas} title="Última página">
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                        
                        <div className="pagination-jump">
                            <span>Ir a:</span>
                            <select
                                value={paginaActual}
                                onChange={(e) => irAPagina(Number(e.target.value))}
                                className="form-select-sm"
                            >
                                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
                                    <option key={pagina} value={pagina}>
                                        Página {pagina}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListVentaComponent;