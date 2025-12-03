
import { Navigate, Outlet } from 'react-router-dom';
import AuthService from '../services/AuthService.js'; // Uso 'AuthService' (mayúsculas) como en tus otros archivos

export const ProtectedRoute = () => {
    // Usamos la función .getCurrentUser() que definimos
    const user = AuthService.getCurrentUser(); 

    if (!user) {
        // No hay token, redirige a login
        return <Navigate to="/login" replace />;
    }

    // Si hay token, muestra el componente hijo
    return <Outlet />;
};

export default ProtectedRoute;