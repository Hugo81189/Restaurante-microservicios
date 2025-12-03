import axios from 'axios';
import Swal from 'sweetalert2';
// ❌ ¡NO IMPORTES AUTHSERVICE AQUÍ! Rompe el ciclo.

const api = axios.create({
    // baseURL: 'http://localhost:8080' // O puedes dejarlo vacío
});

/**
 * Interceptor para INYECTAR el token en todas las peticiones
 */
api.interceptors.request.use(
    (config) => {
        // ✅ Lee el token DIRECTAMENTE de localStorage
        const token = localStorage.getItem('userToken'); 
        
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Interceptor para MANEJAR errores
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        
        // --- CASO 1: NO AUTORIZADO (401) ---
        // El token expiró o es inválido.
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('userToken');
            window.location.href = '/login';
        }
        
        // --- CASO 2: PROHIBIDO (403) - ¡LO NUEVO! ---
        // El usuario está logueado pero no tiene permiso para esto.
        if (error.response && error.response.status === 403) {
            
            // Mostrar mensaje de "Acceso Denegado"
            Swal.fire({
                title: 'Acceso Denegado',
                text: 'No tienes permisos suficientes para realizar esta acción o ver este recurso.',
                icon: 'warning',
                confirmButtonColor: '#3E6770',
                confirmButtonText: 'Entendido'
            });
            
            // Opcional: Redirigir al home si intentó entrar a una página completa
            // window.location.href = '/'; 
        }

        // --- CASO 3: ERROR DE SERVIDOR (500) ---
        if (error.response && error.response.status === 500) {
            console.error("Error del servidor:", error.response.data);
            // Puedes mostrar un toast o dejar que el componente lo maneje
        }

        return Promise.reject(error);
    }
);

export default api;