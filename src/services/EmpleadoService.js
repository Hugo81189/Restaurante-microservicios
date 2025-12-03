// services/EmpleadoService.js - VERSIÓN CORREGIDA
import api from './api';

// ⬅️ DEFINIR LA CONSTANTE QUE FALTA
// 1. Leemos la base (http://localhost:8082 o /proxy/reservas)
const BASE_URL = import.meta.env.VITE_RESERVAS_URL;

// 2. Construimos la ruta completa
const EMPLEADO_API_BASE_URL = `${BASE_URL}/api/empleados`; // Puerto de reservaciones

export const listEmpleados = (filtro = '', filtroEstado = 'TODOS', filtroPuesto = 'TODOS') => {
    // Construye la URL con parámetros de consulta
    const url = `${EMPLEADO_API_BASE_URL}?filtro=${filtro}&estado=${filtroEstado}&puesto=${filtroPuesto}`;
    return api.get(url);
};
export const listEmpleadosActivos = () => api.get(`${EMPLEADO_API_BASE_URL}/activos`);
export const getEmpleadosByStatus = (status) => api.get(`${EMPLEADO_API_BASE_URL}/status/${status}`);
export const getEmpleadoById = (id) => api.get(`${EMPLEADO_API_BASE_URL}/${id}`);
export const crearEmpleado = (empleado) => api.post(EMPLEADO_API_BASE_URL, empleado);
export const updateEmpleado = (id, empleado) => api.put(`${EMPLEADO_API_BASE_URL}/${id}`, empleado);
export const deleteEmpleado = (id) => api.delete(`${EMPLEADO_API_BASE_URL}/${id}`);