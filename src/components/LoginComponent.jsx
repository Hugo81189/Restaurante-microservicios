import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/AuthService.js';
import '../components/LoginComponent.css';

export const LoginComponent = () => {
    const [form, setForm] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Función para manejar cambios en los inputs
    const onChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Función para manejar el envío del formulario
    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.login(form.username, form.password);
            const user = authService.getCurrentUser();
            
            if (user && user.mustChangePassword) {
                navigate('/change-password');
            } else {
                
                // --- ¡LÓGICA DE REDIRECCIÓN CORREGIDA! ---
                if (user && user.roles) {
                    if (user.roles.includes('ROLE_ADMINISTRADOR') || 
                        user.roles.includes('ROLE_SUPERVISOR') ||
                        user.roles.includes('ROLE_CAJERO')) {
                        
                        // Si es Admin/Staff, envíalo a la lista de clientes
                        navigate('/cliente');
                    } else if (user.roles.includes('ROLE_CLIENTE')) {
                        // Si es Cliente, envíalo a Reservas
                        navigate('/reserva'); 
                    } else {
                        // Si es Mesero (o cualquier otro), envíalo a Ventas
                        navigate('/venta');
                    }
                } else {
                    // Fallback por si el token no tiene roles (raro)
                    navigate('/');
                }
            }
            
            // --- ¡IMPORTANTE! ---
            // Forzar recarga para que el HeaderComponent lea el nuevo token
            window.location.reload();

        } catch (err) {
            setError('Usuario o contraseña incorrectos.');
            setLoading(false); // Detiene la carga solo si hay error
        }
        
        // No pongas setLoading(false) aquí, la página se va a recargar
    };

    // Función para ir al registro (si es necesaria)
    const irRegistro = () => {
        // Lógica para redirigir al registro
        navigate('/register');
    };

    return (
        <div className="login-container d-flex">
            {/* Sección izquierda con el formulario */}
            <div 
                className="login-form-section d-flex align-items-start justify-content-center"
            >
                <div className="position-relative w-100 login-form-container">
                    <div className="card login-card shadow border-0 rounded-4 m-0">
                        <div className="card-body p-4 p-md-5">
                            <div className="text-center mb-4">
                                <div className="login-icon mb-3">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="var(--color-primary)"/>
                                        <path d="M12 14.5C6.99 14.5 2.91 17.86 2.91 22C2.91 22.28 3.13 22.5 3.41 22.5H20.59C20.87 22.5 21.09 22.28 21.09 22C21.09 17.86 17.01 14.5 12 14.5Z" fill="var(--color-primary)"/>
                                    </svg>
                                </div>
                                <h1 className="h3 fw-bold mb-1 login-title">
                                    ¡BIENVENIDO!
                                </h1>
                                <p className="text-muted small">
                                    Sistema de Gestión de Restaurante
                                </p>
                            </div>

                            {error && (
                                <div className="alert alert-danger py-2 small d-flex align-items-center" role="alert">
                                    <svg className="me-2" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM7 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm1 9a1 1 0 0 0-1-1h-.5a1 1 0 0 0 0 2H8a1 1 0 0 0 1-1z"/>
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={onSubmit} noValidate>
                                <div className="mb-3">
                                    <label
                                        htmlFor="username"
                                        className="form-label small fw-semibold"
                                    >
                                        Correo Electrónico
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-light border-end-0">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z"/>
                                            </svg>
                                        </span>
                                        <input
                                            id="username"
                                            name="username"
                                            className="form-control border-start-0"
                                            value={form.username}
                                            onChange={onChange}
                                            required
                                            autoFocus
                                            autoComplete="username"
                                            spellCheck={false}
                                            placeholder="Tu correo electrónico"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label
                                        htmlFor="password"
                                        className="form-label small fw-semibold"
                                    >
                                        Contraseña
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-light border-end-0">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                                            </svg>
                                        </span>
                                        <input
                                            id="password"
                                            name="password"
                                            type={show ? "text" : "password"}
                                            className="form-control border-start-0"
                                            value={form.password}
                                            onChange={onChange}
                                            required
                                            autoComplete="current-password"
                                            placeholder="Tu contraseña"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary border-start-0"
                                            onClick={() => setShow((s) => !s)}
                                            disabled={loading}
                                            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        >
                                            {show ? (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                                                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                                                    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <div className="d-flex justify-content-end mt-1">
                                        <button type="button" className="btn btn-link p-0 small text-decoration-none">
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-lg w-100 text-white fw-semibold mt-3 login-btn"
                                    type="submit"
                                    disabled={loading || !form.username || !form.password}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Iniciando Sesión...
                                        </>
                                    ) : (
                                        "Iniciar Sesión"
                                    )}
                                </button>
                            </form>

                            <p className="text-center mt-4 mb-0 small">
                                ¿No tienes una cuenta?{" "}
                                <button
                                    type="button"
                                    className="btn btn-link p-0 align-baseline fw-semibold text-decoration-none register-link"
                                    onClick={irRegistro}
                                >
                                    Regístrate
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección derecha con el diseño de arco */}
            <div className="login-graphic-section position-relative">
                {/* Arco decorativo */}
                <div className="arc-design position-absolute"/>
                
                {/* Contenido gráfico adicional */}
                <div className="graphic-content text-center text-white position-relative z-1">
                    <div className="mb-4">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 1.5C6.07 1.5 4.5 3.07 4.5 5C4.5 6.93 6.07 8.5 8 8.5C9.93 8.5 11.5 6.93 11.5 5C11.5 3.07 9.93 1.5 8 1.5Z" fill="white"/>
                            <path d="M8 9.5C5.24 9.5 3 11.74 3 14.5V16.5C3 17.05 3.45 17.5 4 17.5H12C12.55 17.5 13 17.05 13 16.5V14.5C13 11.74 10.76 9.5 8 9.5Z" fill="white"/>
                            <path d="M16 1.5C14.07 1.5 12.5 3.07 12.5 5C12.5 6.93 14.07 8.5 16 8.5C17.93 8.5 19.5 6.93 19.5 5C19.5 3.07 17.93 1.5 16 1.5Z" fill="white"/>
                            <path d="M16 9.5C15.04 9.5 14.16 9.77 13.38 10.23C14.04 10.82 14.5 11.62 14.5 12.5V13.5H20.5V12.5C20.5 11.62 20.96 10.82 21.62 10.23C20.84 9.77 19.96 9.5 19 9.5H16Z" fill="white"/>
                        </svg>
                    </div>
                    <h2 className="fw-bold mb-3">Restaurante Gourmet</h2>
                    <p className="mb-0 opacity-75">
                        Sistema de gestión integral para tu restaurante
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginComponent;