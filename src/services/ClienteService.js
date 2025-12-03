import api from './api';
const BASE_URL = import.meta.env.VITE_RESTAURANTES_URL; 
const REST_API_BASE_URL = `${BASE_URL}/api/cliente`;

export const listClientes = (filtro = '', campoFiltro = 'nombre') => {
    const url = `${REST_API_BASE_URL}?filtro=${filtro}&campo=${campoFiltro}`;
    return api.get(url);
};
export const crearCliente = (cliente) => api.post(REST_API_BASE_URL, cliente);
export const getCliente = (id) => api.get(`${REST_API_BASE_URL}/${id}`);
export const updateCliente = (id, cliente) => api.put(`${REST_API_BASE_URL}/${id}`, cliente);
export const deleteCliente = (id) => api.delete(`${REST_API_BASE_URL}/${id}`);
export const getClienteByUsername = (username) => api.get(`${REST_API_BASE_URL}/by-username/${username}`);