import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import { UserCircle } from "lucide-react";

import AuthService from '../services/AuthService.js';

export const HeaderComponent = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());

    const handleLogout = () => {
        Swal.fire({
            title: "¿Cerrar Sesión?",
            text: "¿Estás seguro de que deseas cerrar tu sesión?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: 'Sí, Salir',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#3E6770'
        }).then((result) => {
            if (result.isConfirmed) {
                AuthService.logout(); 
                setCurrentUser(null);
                navigate('/login');
                Swal.fire('Sesión Cerrada', 'Has cerrado tu sesión exitosamente.', 'success');
            }
        });
    };

    const hasAccess = (requiredRoles) => {
        if (!currentUser || !currentUser.roles) return false;
        return currentUser.roles.some(role =>
            requiredRoles.includes(role.toUpperCase())
        );
    };

    useEffect(() => {
        const handleStorageChange = () => {
            setCurrentUser(AuthService.getCurrentUser());
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const formatRole = (role) => {
        return role.replace('ROLE_', '').charAt(0) + role.replace('ROLE_', '').slice(1).toLowerCase();
    };

    return (
        <header>
            <nav className="navbar navbar-expand-lg navbar-custom fixed-top">
                <div className="navbar-inner d-flex align-items-center w-100">
                    <NavLink className="navbar-brand fw-bold fs-3" to="/">
                        Mi Restaurante
                    </NavLink>

                    <button
                        className="navbar-toggler border-0 ms-auto"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">

                            {currentUser ? (
                                <>
                                    {/* CLIENTE - Vista productos y Reservación */}
                                    {hasAccess(['ROLE_CLIENTE']) && (
                                        <>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/producto">Productos</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/reserva">Reservas</NavLink></li>
                                        </>
                                    )}

                                    {/* MESERO - Atiende ventas */}
                                    {hasAccess(['ROLE_MESERO']) && (
                                        <li className="nav-item"><NavLink className="nav-link nav-underline" to="/venta">Ventas</NavLink></li>
                                    )}

                                    {/* CAJERO - Reservación, Ventas, Clientes */}
                                    {hasAccess(['ROLE_CAJERO']) && (
                                        <>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/reserva">Reservas</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/venta">Ventas</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/cliente">Clientes</NavLink></li>
                                        </>
                                    )}

                                    {/* ADMINISTRADOR - Acceso total */}
                                    {hasAccess(['ROLE_ADMINISTRADOR']) && (
                                        <>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/cliente">Clientes</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/empleado">Empleados</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/producto">Productos</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/tipo">Tipos</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/mesa">Mesas</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/venta">Ventas</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/reserva">Reservas</NavLink></li>
                                        </>
                                    )}

                                    {/* SUPERVISOR - Clientes y Productos */}
                                    {hasAccess(['ROLE_SUPERVISOR']) && (
                                        <>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/cliente">Clientes</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/empleado">Empleados</NavLink></li>
                                            <li className="nav-item"><NavLink className="nav-link nav-underline" to="/producto">Productos</NavLink></li>
                                        </>
                                    )}

                                    {/* 💡 SECCIÓN DE INFORMACIÓN DEL USUARIO */}
                                    <li className="nav-item ms-lg-4 me-lg-2 d-flex align-items-center text-black">
                                        <div className="d-flex flex-column align-items-end lh-1">
                                            <span className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                                {currentUser.sub}
                                            </span>
                                            <span className="opacity-75" style={{ fontSize: '0.75rem' }}>
                                                {currentUser.roles.map(formatRole).join(', ')}
                                            </span>
                                        </div>
                                        <UserCircle className="ms-2" size={32} />
                                    </li>

                                    {/* Botón Logout */}
                                    <li className="nav-item">
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={handleLogout}
                                        >
                                            Salir
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li className="nav-item">
                                    <NavLink className="btn btn-sm btn-primary btn-rosa" to="/login">
                                        Iniciar Sesión
                                    </NavLink>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default HeaderComponent;