import api from './api';

export const BASE_URL = '/proxy/fonda';
const REST_API_BASE_URL = '/proxy/fonda/api/producto';


export const listProductos = (filtroNombre = '', filtroTipoId = '', minPrice = '', maxPrice = '') => {
    // Construye la URL con parámetros de consulta
    const params = new URLSearchParams();

    if (filtroNombre) params.append('nombre', filtroNombre);
    if (filtroTipoId) params.append('idTipo', filtroTipoId);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);

    const url = `${REST_API_BASE_URL}?${params.toString()}`;
    return api.get(url);
};
export const crearProducto = (formData) =>
    api.post(REST_API_BASE_URL, formData, {
        headers: {
            'Content-Type': 'multipart/form-data', // Asegura la cabecera
        },
    });
export const getProducto = (id) => api.get(`${REST_API_BASE_URL}/${id}`);
export const updateProducto = (id, formData) =>
    api.put(`${REST_API_BASE_URL}/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data', // Asegura la cabecera
        },
    });
export const deleteProducto = (id) => api.delete(`${REST_API_BASE_URL}/${id}`);