import api from './api';

const BASE_URL = import.meta.env.VITE_FONDA_URL;
const REST_API_BASE_URL = `${BASE_URL}/api/tipo`;

export const listTipos = () => api.get(REST_API_BASE_URL);
export const crearTipo = (tipo) => api.post(REST_API_BASE_URL, tipo);
export const getTipo = (id) => api.get(`${REST_API_BASE_URL}/${id}`);
export const updateTipo = (id, tipo) => api.put(`${REST_API_BASE_URL}/${id}`, tipo);
export const deleteTipo = (id) => api.delete(`${REST_API_BASE_URL}/${id}`);