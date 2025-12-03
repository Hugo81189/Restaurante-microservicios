import api from './api';

    const ATIENDE_API_BASE_URL = '/proxy/reservas/api/atiende'; // Puerto de reservaciones

    export const createAtiende = (atiendeDto) => api.post(ATIENDE_API_BASE_URL, atiendeDto);
    export const getAtiendeById = (id) => api.get(`${ATIENDE_API_BASE_URL}/${id}`);
    export const getAtiendeByVentaId = (ventaId) => api.get(`${ATIENDE_API_BASE_URL}/venta/${ventaId}`);
    export const updateAtiende = (id, atiendeDto) => api.put(`${ATIENDE_API_BASE_URL}/${id}`, atiendeDto);
    export const deleteAtiende = (id) => api.delete(`${ATIENDE_API_BASE_URL}/${id}`);
    