// src/components/ChangePasswordComponent.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/AuthService.js';
// Reutilizamos el mismo CSS
import '../components/LoginComponent.css';

export const ChangePasswordComponent = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    
    const navigate = useNavigate();

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);

        try {
            await authService.changePassword(password);
            
            setSuccess('¡Contraseña actualizada! Serás redirigido al login en 3 segundos...');
            setLoading(false);

            // Cerramos la sesión del usuario (su token temporal ya no es válido)
            authService.logout();

            // Redirigir a login después de 3 segundos
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setLoading(false);
            setError('Ocurrió un error. Inténtalo de nuevo.');
        }
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
                                    {/* Icono de Llave */}
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12.83 2.84C11.3 2.32 9.63 2.47 8.13 3.2C4.43 4.91 2.8 9.06 4.51 12.76C5.59 15.11 7.82 16.7 10.32 17.13V21H12.32V17.13C14.82 16.7 17.05 15.11 18.13 12.76C19.84 9.06 18.21 4.91 14.51 3.2C13.88 2.94 13.23 2.82 12.56 2.82L12.83 2.84ZM12.32 9H10.32V7H12.32V9Z" fill="var(--color-primary)"/>
                                    </svg>
                                </div>
                                <h1 className="h3 fw-bold mb-1 login-title">
                                    ACTUALIZA TU CONTRASEÑA
                                </h1>
                                <p className="text-muted small">
                                    Por seguridad, debes establecer una nueva contraseña.
                                </p>
                            </div>

                            {/* Alerta de Error */}
                            {error && (
                                <div className="alert alert-danger py-2 small d-flex align-items-center" role="alert">
                                    <svg className="me-2" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM7 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm1 9a1 1 0 0 0-1-1h-.5a1 1 0 0 0 0 2H8a1 1 0 0 0 1-1z"/>
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Alerta de Éxito */}
                            {success && (
                                <div className="alert alert-success py-2 small" role="alert">
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleChangePassword} noValidate>
                                
                                <div className="mb-3">
                                    <label
                                        htmlFor="password"
                                        className="form-label small fw-semibold"
                                    >
                                        Nueva Contraseña
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-light border-end-0">
                                            {/* Icono Candado */}
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
                                        </span>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPass ? "text" : "password"}
                                            className="form-control border-start-0"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            placeholder="Escribe tu nueva contraseña"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary border-start-0"
                                            onClick={() => setShowPass((s) => !s)}
                                            disabled={loading}
                                        >
                                            {/* Iconos de Ojo */}
                                            {showPass ? (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/><path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/><path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="mb-3">
                                    <label
                                        htmlFor="confirmPassword"
                                        className="form-label small fw-semibold"
                                    >
                                        Confirmar Contraseña
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-light border-end-0">
                                            {/* Icono Candado */}
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
                                        </span>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showPass ? "text" : "password"}
                                            className="form-control border-start-0"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            placeholder="Repite tu nueva contraseña"
                                        />
                                    </div>
                                </div>

                                <button
                                    className="btn btn-lg w-100 text-white fw-semibold mt-3 login-btn"
                                    type="submit"
                                    disabled={loading || !password || !confirmPassword}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Actualizando...
                                        </>
                                    ) : (
                                        "Actualizar Contraseña"
                                    )}
                                </button>
                            </form>

                            <p className="text-center mt-4 mb-0 small">
                                ¿Recordaste tu contraseña?{" "}
                                <Link
                                    to="/login"
                                    className="btn btn-link p-0 align-baseline fw-semibold text-decoration-none register-link"
                                    onClick={() => authService.logout()} // Cierra sesión si regresa
                                >
                                    Volver a Iniciar Sesión
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección derecha con el diseño de arco (Idéntica al Login) */}
            <div className="login-graphic-section position-relative">
                <div className="arc-design position-absolute"/>
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
}

export default ChangePasswordComponent;