import React, { useEffect, useState } from "react";
// 💡 listClientes ahora acepta parámetros
import { listClientes, deleteCliente } from "../services/ClienteService"; 
import { useNavigate } from "react-router-dom";
import { ClienteCard } from "./ClienteCard";
import Swal from 'sweetalert2';
import { Search } from "lucide-react"; // Importar icono de búsqueda

export const ListClienteComponent = () => {
    // Clientes contiene la lista YA FILTRADA por el backend
    const [clientes, setClientes] = useState([]); 
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Usaremos un estado para almacenar el valor de búsqueda y otro para el filtro actual
    const [filtroTexto, setFiltroTexto] = useState(''); // El texto que escribe el usuario
    const [campoFiltro, setCampoFiltro] = useState('nombre'); 
    
    // Nota: Eliminamos clientesMostrados, ya que 'clientes' son los que se muestran
    
    const navegar = useNavigate();

    // 💡 FUNCIÓN DE CARGA ÚNICA CON FILTROS ENVIADOS AL BACKEND
    function getClientesConFiltro(filtro, campo) {
        setLoading(true);
        // 💡 LLAMADA AL SERVICIO CON LOS PARÁMETROS
        listClientes(filtro, campo) 
            .then((response) => {
                setClientes(response.data || []);
                setError(null);
            })
            .catch((error) => {
                console.error("Error loading clients:", error);
                setError("No se pudieron cargar los clientes.");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    // 💡 Efecto inicial: Cargar todos al principio
    useEffect(() => {
        getClientesConFiltro('', 'nombre');
    }, []);
    
    // 💡 Handler que se dispara al presionar el botón 'Buscar' o la tecla Enter
    const handleSearch = () => {
        // Solo realizamos la búsqueda si hay texto en el filtro
        if (filtroTexto.trim()) {
            getClientesConFiltro(filtroTexto, campoFiltro);
        } else {
            // Si el campo está vacío y se presiona buscar, mostramos todos
            getClientesConFiltro('', campoFiltro);
        }
    };

    const handleClear = () => {
        setFiltroTexto('');
        // Limpia el filtro en el backend para mostrar todos
        getClientesConFiltro('', campoFiltro); 
    };

    function nuevoCliente() {
        navegar("/cliente/crear");
    }

    function actualizarCliente(id) {
        navegar(`/cliente/edita/${id}`);
    }

    function eliminarCliente(id) {
        const cliente = clientes.find(c => c.id === id);
        
        Swal.fire({
            title: "¿Estás seguro?",
            html: `El cliente <strong>"${cliente?.nombreCliente}"</strong> será <strong>eliminado definitivamente</strong>.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: '#dc3545', 
            cancelButtonColor: '#3E6770', 
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return deleteCliente(id)
                    .catch(error => {
                        Swal.showValidationMessage(
                            `Error: ${error.response?.data?.message || 'No se pudo eliminar el cliente'}`
                        );
                    });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire(
                    '¡Eliminado!',
                    'El cliente ha sido eliminado correctamente.',
                    'success'
                );
                // Recargar la lista completa (o con el filtro actual, en este caso, completa)
                getClientesConFiltro('', campoFiltro); 
            }
        });
    }

    // Estados de carga
    if (loading) {
        return (
            <div className="page-wrap">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3 text-muted">Cargando clientes...</p>
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
                        onClick={() => getClientesConFiltro('', 'nombre')} // Reintentar
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }
    
    // Se usa 'clientes.length' para saber cuántos se muestran
    const totalClientesCargados = clientes.length;

    return (
        <div className="page-wrap">
            {/* Header mejorado */}
            <div className="client-header-grid">
                <div>
                    <h1 className="client-title">Gestión de Clientes</h1>
                    <p className="client-subtitle-ajustado">Administra tu base de clientes del restaurante</p>
                </div>
                <button className="btn-nuevo btn-rosa btn-header-action" onClick={nuevoCliente}>
                    <span className="me-2">➕</span>
                    Nuevo Cliente
                </button>
            </div>

            {/* Sistema de filtros mejorado */}
            <div className="filtros-container mb-4">
                <div className="row g-3 align-items-end">
                    <div className="col-md-5">
                        <label htmlFor="busqueda" className="form-label small fw-semibold">
                            🔍 Buscar cliente
                        </label>
                        <input
                            id="busqueda"
                            type="text"
                            className="form-control"
                            placeholder="Ingresa nombre, correo o teléfono..."
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                            // Opcional: Buscar al presionar Enter
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        />
                    </div>
                    <div className="col-md-4">
                        <label htmlFor="campoFiltro" className="form-label small fw-semibold">
                            Buscar por
                        </label>
                        <select 
                            id="campoFiltro"
                            value={campoFiltro} 
                            onChange={(e) => setCampoFiltro(e.target.value)}
                            className="form-select"
                        >
                            <option value="nombre">Nombre</option>
                            <option value="correo">Correo electrónico</option>
                            <option value="telefono">Teléfono</option>
                        </select>
                    </div>
                    <div className="col-md-3 d-flex gap-2">
                        <button
                            onClick={handleSearch}
                            disabled={!filtroTexto.trim()} // Deshabilitado si el texto está vacío
                            className="btn btn-rosa"
                            style={{ flexGrow: 1 }}
                        >
                            <Search size={16} className="me-2" /> Buscar
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={!filtroTexto}
                            className="btn btn-outline-secondary"
                            style={{ flexGrow: 1 }}
                        >
                            Limpiar
                        </button>
                    </div>
                </div>
                
                {/* Contadores y información del filtro */}
                <div className="mt-3">
                    <span className="text-muted small">
                        Mostrando {totalClientesCargados} cliente(s)
                        {(filtroTexto && clientes.length > 0) && (
                            <span>
                                {" • "}Filtrado por {campoFiltro}: "{filtroTexto}"
                            </span>
                        )}
                        {totalClientesCargados === 0 && filtroTexto && (
                             <span className="text-danger ms-2">
                                {" • "}No se encontraron resultados.
                            </span>
                        )}
                    </span>
                </div>
            </div>

            {/* Grid de clientes */}
            <div className="clientes-grid">
                {totalClientesCargados === 0 && !filtroTexto ? (
                    // Estado vacío (No hay clientes en total)
                    <div className="text-center py-5" style={{ gridColumn: '1 / -1' }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <h4 className="empty-state-title">No hay clientes registrados</h4>
                            <p className="empty-state-text text-muted">
                                Comienza agregando tu primer cliente al sistema.
                            </p>
                            <button 
                                className="btn btn-rosa mt-3"
                                onClick={nuevoCliente}
                            >
                                ➕ Agregar Primer Cliente
                            </button>
                        </div>
                    </div>
                ) : totalClientesCargados === 0 && filtroTexto ? (
                    // Estado sin resultados (Búsqueda no encontró nada)
                    <div className="text-center py-5" style={{ gridColumn: '1 / -1' }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">🔍</div>
                            <h4 className="empty-state-title">No se encontraron clientes</h4>
                            <p className="empty-state-text text-muted">
                                No hay clientes que coincidan con "{filtroTexto}" en {campoFiltro}.
                            </p>
                            <button 
                                className="btn btn-outline-rosa mt-3"
                                onClick={handleClear}
                            >
                                🔄 Mostrar todos los clientes
                            </button>
                        </div>
                    </div>
                ) : (
                    // Mostrar las tarjetas
                    clientes.map((cliente) => ( 
                        <ClienteCard
                            key={cliente.id}
                            cliente={{
                                id: cliente.id,
                                nombre: cliente.nombreCliente,
                                correo: cliente.correo,
                                telefono: cliente.telefono,
                            }}
                            onEdit={actualizarCliente}
                            onDelete={eliminarCliente}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ListClienteComponent;