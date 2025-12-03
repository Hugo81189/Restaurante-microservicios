import React, { useEffect, useState } from "react";
import AuthService from "../services/AuthService";
import { listProductos, deleteProducto } from "../services/ProductoService"; 
import { listTipos } from "../services/TipoService";
import { useNavigate } from "react-router-dom";
import { ProductoCard } from "./ProductoCard.jsx";
import Swal from 'sweetalert2';
import { Search, Filter, DollarSign, Package } from "lucide-react"; // Iconos

export const ListProductoComponent = () => {
    // Clientes contiene la lista YA FILTRADA por el backend
    const [productos, setProductos] = useState([]); 
    const [tipos, setTipos] = useState([]);
    const [error, setError] = useState(null);
    const [loadingProductos, setLoadingProductos] = useState(true);
    const [loadingTipos, setLoadingTipos] = useState(true);
    const [errorTipos, setErrorTipos] = useState(null);

    // --- ESTADOS DE FILTRO (Frontend) ---
    const [filtroTexto, setFiltroTexto] = useState(''); // Nombre/Descripción
    const [filtroTipo, setFiltroTipo] = useState('');    // ID Tipo
    const [precioMin, setPrecioMin] = useState('');
    const [precioMax, setPrecioMax] = useState('');
    
    // 💡 ESTADOS QUE ALMACENAN EL ÚLTIMO FILTRO ENVIADO AL BACKEND
    const [ultimaBusqueda, setUltimaBusqueda] = useState({nombre: '', tipo: '', min: '', max: ''});

    const [currentUser] = useState(AuthService.getCurrentUser());
    const userRoles = currentUser?.roles || [];
    // Solo Admin y Supervisor pueden gestionar productos
    const canManage = userRoles.some(role => 
        ['ROLE_ADMINISTRADOR', 'ROLE_SUPERVISOR'].includes(role)
    );

    const navegar = useNavigate();

    // 💡 FUNCIÓN DE CARGA ÚNICA CON FILTROS ENVIADOS AL BACKEND
    function cargarProductos(filtroNombre, filtroTipoId, minPrice, maxPrice) {
        setLoadingProductos(true);
        listProductos(filtroNombre, filtroTipoId, minPrice, maxPrice)
            .then((res) => {
                setProductos(res?.data || []);
                setError(null);
                setUltimaBusqueda({
                    nombre: filtroNombre, 
                    tipo: filtroTipoId, 
                    min: minPrice, 
                    max: maxPrice
                });
            })
            .catch((e) => {
                console.error("Error loading products:", e);
                setError("No se pudieron cargar los productos.");
            })
            .finally(() => {
                setLoadingProductos(false);
            });
    }

    // 💡 Handlers de búsqueda y limpieza
    const handleSearch = () => {
        // Dispara la búsqueda con los valores actuales de los inputs/selects
        // Se asegura de enviar números como strings vacíos si no se rellenan
        cargarProductos(filtroTexto, filtroTipo, precioMin, precioMax);
    };
    
    const handleClear = () => {
        setFiltroTexto('');
        setFiltroTipo('');
        setPrecioMin('');
        setPrecioMax('');
        // Vuelve a cargar todos los productos
        cargarProductos('', '', '', ''); 
    };
    
    // --- EFECTOS ---

    useEffect(() => {
        // Carga inicial sin filtros
        cargarProductos('', '', '', '');
    }, []);

    useEffect(() => {
        listTipos()
            .then((response) => {
                const tiposNormalizados = response.data.map(tipo => ({
                    id: tipo.id,
                    nombre: tipo.tipo || tipo.nombre
                }));
                setTipos(tiposNormalizados);
                setLoadingTipos(false);
            })
            .catch((error) => {
                console.error("Error al cargar los tipos:", error);
                setErrorTipos("No se pudieron cargar los tipos de producto.");
                setLoadingTipos(false);
            });
    }, []);

    const obtenerNombreTipo = (idTipo) => {
        if (!idTipo) return "Sin Tipo";
        const tipo = tipos.find(t => t.id === idTipo);
        return tipo ? tipo.nombre : "Tipo Desconocido";
    };

    function nuevoProducto() { navegar('/producto/crear'); }
    function actualizarProducto(id) { navegar(`/producto/edita/${id}`); }
    function eliminarProducto(id) { 
        const producto = productos.find(p => p.idProducto === id);
        
        Swal.fire({
            title: "¿Estás seguro?",
            html: `El producto <strong>"${producto?.nombre}"</strong> será <strong>inhabilitado (Status 0)</strong> y no aparecerá en el menú activo.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#3E6770',
            confirmButtonText: 'Sí, inhabilitar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteProducto(id)
                    .then(() => {
                        Swal.fire(
                            '¡Inhabilitado!',
                            'El producto ha sido marcado como inactivo (Status 0).',
                            'success'
                        );
                        // Recargar con los filtros actuales para mantener la vista
                        cargarProductos(ultimaBusqueda.nombre, ultimaBusqueda.tipo, ultimaBusqueda.min, ultimaBusqueda.max);
                    })
                    .catch((error) => {
                        console.error(error);
                        Swal.fire(
                            'Error',
                            'Hubo un problema al inhabilitar el producto.',
                            'error'
                        );
                    });
            }
        });
    }

    const totalProductosMostrados = productos.length;
    // Determinar si hay algún filtro activo para mostrar el estado de la búsqueda
    const isFiltroActivo = filtroTexto || filtroTipo || precioMin || precioMax;


    if (loadingProductos || loadingTipos) {
        return (
            <div className="page-wrap">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3 text-muted">Cargando datos...</p>
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
                        onClick={() => cargarProductos('', '', '', '')} // Reintentar
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrap">
            <div className="client-header-grid">
                <div>
                    <h1 className="client-title">Gestión de Productos</h1>
                    <p className="client-subtitle-ajustado">Administra el menú y el catálogo de la fonda</p>
                </div>
                {/* 3. CONDICIONAR EL BOTÓN NUEVO PRODUCTO */}
                {canManage && (
                    <button className="btn-nuevo btn-rosa btn-header-action" onClick={nuevoProducto}>
                        <span className="me-2">➕</span>
                        Nuevo Producto
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="filtros-container mb-4">
                <div className="row g-3 align-items-end">
                    
                    {/* Filtro Nombre */}
                    <div className="col-md-3">
                        <label htmlFor="busqueda" className="form-label small fw-semibold">
                            <Package size={14} className="me-1" /> Nombre / Descripción
                        </label>
                        <input
                            id="busqueda"
                            type="text"
                            placeholder="Nombre, descripción..."
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    
                    {/* Filtro Tipo */}
                    <div className="col-md-3">
                        <label htmlFor="tipoFiltro" className="form-label small fw-semibold">
                            <Filter size={14} className="me-1" /> Tipo de Producto
                        </label>
                        <select 
                            id="tipoFiltro"
                            value={filtroTipo} 
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="form-select"
                        >
                            <option value="">Todos los tipos</option>
                            {tipos.map(tipo => (
                                <option key={tipo.id} value={tipo.id}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Precio Mínimo */}
                    <div className="col-md-2">
                        <label htmlFor="precioMin" className="form-label small fw-semibold">
                            <DollarSign size={14} className="me-1" /> Precio Mín.
                        </label>
                        <input
                            id="precioMin"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={precioMin}
                            onChange={(e) => setPrecioMin(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    
                    {/* Filtro Precio Máximo */}
                    <div className="col-md-2">
                        <label htmlFor="precioMax" className="form-label small fw-semibold">
                            Precio Máx.
                        </label>
                        <input
                            id="precioMax"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="999.99"
                            value={precioMax}
                            onChange={(e) => setPrecioMax(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    
                    {/* Botones */}
                    <div className="col-md-2 d-flex gap-2">
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="btn btn-search w-50"
                            disabled={!isFiltroActivo} // Deshabilitado si no hay nada escrito
                        >
                            <Search size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="btn btn-clear w-50"
                            disabled={!isFiltroActivo} // Deshabilitado si no hay filtro que limpiar
                        >
                            Limpiar
                        </button>
                    </div>
                </div>
                
                {/* Contadores */}
                <div className="mt-3 text-muted small">
                    Mostrando {totalProductosMostrados} producto(s)
                    {isFiltroActivo && (
                         <span className="ms-2 badge bg-primary">
                            Búsqueda Activa
                        </span>
                    )}
                </div>
            </div>

            {/* Grid de productos */}
            <div className="clientes-grid">
                {totalProductosMostrados === 0 ? (
                     <div className="text-center py-5" style={{ gridColumn: '1 / -1' }}>
                        <em className="text-muted">No se encontraron productos que coincidan con los filtros.</em>
                    </div>
                ) : (
                    productos.map((p) => (
                        <ProductoCard
                            key={p.idProducto}
                            producto={p}
                            nombreTipo={obtenerNombreTipo(p.idTipo)}
                            onEdit={canManage ? actualizarProducto : null}
                            onDelete={canManage ? eliminarProducto : null}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ListProductoComponent;