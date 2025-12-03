import api from './api';


const REST_API_BASE_URL = '/proxy/fonda/api/ventas';

export const crearVenta = (ventaDto) => api.post(REST_API_BASE_URL, ventaDto);
export const listVentas = (
    filtroNombre = '', 
    filtroEstado = 'TODAS', 
    fechaExacta = '', 
    fechaInicio = '', 
    fechaFin = '',
    ordenarPor = 'fecha',
    ordenAscendente = false
) => {
    // Construye la URL con parámetros de consulta
    const params = new URLSearchParams();
    
    if (filtroNombre) params.append('nombreCliente', filtroNombre);
    if (filtroEstado !== 'TODAS') params.append('status', filtroEstado);
    if (fechaExacta) params.append('fechaExacta', fechaExacta);
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    params.append('ordenarPor', ordenarPor);
    params.append('ordenAscendente', ordenAscendente);
    
    const url = `${REST_API_BASE_URL}?${params.toString()}`;
    return api.get(url);
};
export const getVentaById = (id) => api.get(`${REST_API_BASE_URL}/${id}`);
export const cancelarVenta = (id) => api.delete(`${REST_API_BASE_URL}/${id}`);
export const deleteVenta = (id) => api.delete(`${REST_API_BASE_URL}/${id}`);
export const updateVenta = (id, ventaDto) => api.put(`${REST_API_BASE_URL}/${id}`, ventaDto);
export const finalizarVenta = (id) => api.put(`${REST_API_BASE_URL}/finalizar/${id}`);
export const agregarProductoAlPedido = (ventaDto) => api.post(`${REST_API_BASE_URL}/agregar-producto`, ventaDto);
export const getVentasByClienteId = (clienteId) => api.get(`${REST_API_BASE_URL}/cliente/${clienteId}`);
export const getVentaAbierta = (clienteId) => api.get(`${REST_API_BASE_URL}/abierta/${clienteId}`);
export const obtenerTicketPdf = (id) => {
    return api.get(`${REST_API_BASE_URL}/ticket/${id}`, {
        responseType: 'blob' // Importante: Indica que esperamos un archivo
    });
};
