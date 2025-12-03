// src/services/auth.service.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Importación corregida
import api from './api.js';

// Apunta a tu auth-server
const API_URL = '/proxy/auth/auth/'; 
const API_MANAGEMENT_URL = '/proxy/auth/api/management/';

class AuthService {

    /**
     * Intenta iniciar sesión en el backend.
     * Si tiene éxito, guarda el token en localStorage.
     */
    async login(username, password) {
        const response = await axios.post(API_URL + 'login', {
            username,
            password
        });

        if (response.data.token) {
            localStorage.setItem('userToken', response.data.token);
        }
        return response.data;
    }

    /**
     * Cierra la sesión del usuario (borra el token).
     */
    logout() {
        localStorage.removeItem('userToken');
    }

    /**
     * Registra un nuevo cliente.
     */
    register(username, password, nombreCliente, telefono, correo) {
        return axios.post(API_URL + 'register', {
            username,
            password,
            nombreCliente,
            telefono,
            correo
        });
    }

    /**
     * Obtiene el token crudo de localStorage.
     */
    getToken() {
        return localStorage.getItem('userToken');
    }

    /**
     * Decodifica el token guardado para obtener los datos del usuario.
     * (username, roles, mustChangePassword)
     */
    getCurrentUser() {
        const token = this.getToken();
        if (token) {
            try {
                // Decodifica el token
                const decodedToken = jwtDecode(token);
                return decodedToken;
            } catch (error) {
                // Token inválido o expirado
                console.error("Token inválido:", error);
                this.logout();
                return null;
            }
        }
        return null;
    }

    /**
     * Llama al endpoint de cambio de contraseña.
     * (Necesita el 'api.js' que crearemos a continuación)
     */
    changePassword(newPassword) {
        return api.post(API_MANAGEMENT_URL + 'change-password', {
            newPassword 
        });
    }

    /**
     * Creación de Empleados (ruta de Admin).
     * Llama al endpoint de orquestación 'create-assisted'.
     * Usa 'api' (el interceptor) porque esta es una ruta protegida.
     */
    crearEmpleadoAsistido(requestData) {
        // requestData debe ser el DTO 'AssistedRegisterRequest'
        // { username, roleName, nombreEmpleado, puestoEmpleado }
        return api.post(API_MANAGEMENT_URL + 'users/create-assisted', requestData);
    }

    /**
     * Llama al endpoint de admin para resetear la contraseña de un usuario.
     * @param {string} username El username del usuario a resetear.
     * @returns {Promise} La respuesta de la API (que incluye la nueva contraseña temporal)
     */
    resetPassword(username) {
        // Usa 'api' (el interceptor) porque es una ruta protegida por Admin
        return api.post(API_MANAGEMENT_URL + 'reset-password', {
            username
        });
    }
}

export default new AuthService();