import api from './api';

const REST_API_BASE_URL = '/proxy/reservas/api/reservas';

export const crearReserva = (reservaDto) => api.post(REST_API_BASE_URL, reservaDto);
export const listReservas = () => api.get(REST_API_BASE_URL);
export const getReservaById = (id) => api.get(`${REST_API_BASE_URL}/${id}`);
export const updateReserva = (id, reservaDto) => api.put(`${REST_API_BASE_URL}/${id}`, reservaDto);
export const deleteReserva = (id) => api.delete(`${REST_API_BASE_URL}/${id}`);
export const getReservasByClienteId = (clienteId) => api.get(`${REST_API_BASE_URL}/cliente/${clienteId}`);
export const getReservasActivasByClienteId = (clienteId) => api.get(`${REST_API_BASE_URL}/cliente/${clienteId}/activas`);
export const getReservasFuturasByClienteId = (clienteId) => api.get(`${REST_API_BASE_URL}/cliente/${clienteId}/futuras`);
export const confirmarReserva = (id) => api.put(`${REST_API_BASE_URL}/${id}/confirmar`);
export const getReservasHoyConfirmadasByClienteId = (clienteId) => 
    api.get(`${REST_API_BASE_URL}/cliente/${clienteId}/hoy-confirmadas`);
export const getMisReservaciones = () => api.get(`${REST_API_BASE_URL}/mis-reservaciones`);