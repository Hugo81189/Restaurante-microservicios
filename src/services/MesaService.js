import api from './api';

const REST_API_BASE_URL = '/proxy/reservas/api/mesa';

export const crearMesa = (mesaDto) => api.post(REST_API_BASE_URL, mesaDto);
export const listMesas = () => api.get(REST_API_BASE_URL);
export const getMesaById = (id) => api.get(`${REST_API_BASE_URL}/${id}`);
export const updateMesa = (id, mesaDto) => api.put(`${REST_API_BASE_URL}/${id}`, mesaDto);
export const deleteMesa = (id) => api.delete(`${REST_API_BASE_URL}/${id}`);