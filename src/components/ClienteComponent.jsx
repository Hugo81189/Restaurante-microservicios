// src/components/ClienteComponent.jsx
import React, { useEffect, useState } from "react";
import AuthService from "../services/AuthService";
import { crearCliente, getCliente, updateCliente } from "../services/ClienteService";
import { useNavigate, useParams } from "react-router-dom";
// Importar iconos
import { User, Phone, Mail, X, AtSign, AlertCircle } from "lucide-react"; 
import Swal from 'sweetalert2';

export const ClienteComponent = () => {
    const [nombreCliente, setNombreCliente] = useState("");
    const [telefono, setTelefono] = useState("");
    const [correo, setCorreo] = useState("");
    const [errors, setErrors] = useState({}); // Usamos objeto para mejor manejo de errores
    const [username, setUsername] = useState("");

    const [touched, setTouched] = useState({});

    const { id } = useParams();
    const navegar = useNavigate();

    // --- Lógica de Validación (Ajustada para SweetAlert) ---
    function validaForm() {
        const errorsCopy = {};
        let valida = true;

        if (!nombreCliente.trim()) {
            errorsCopy.nombreCliente = "El nombre es obligatorio.";
            valida = false;
        }

        if (!telefono.trim() || telefono.trim().length < 8) { // Añadimos validación básica de longitud
            errorsCopy.telefono = "El teléfono es obligatorio y debe ser válido.";
            valida = false;
        }

        // Validación básica de formato de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!correo.trim() || !emailRegex.test(correo.trim())) {
            errorsCopy.correo = "El correo es obligatorio y debe tener un formato válido.";
            valida = false;
        }

        if (!id) { 
            if (!username.trim()) {
                errorsCopy.username = "El nombre de usuario es obligatorio.";
                valida = false;
            } else if (username.trim().length < 3) {
                errorsCopy.username = "Debe tener al menos 3 caracteres";
                valida = false;
            } else if (/\s/.test(username)) {
                errorsCopy.username = "No puede contener espacios";
                valida = false;
            }
        }

        setErrors(errorsCopy);
        return valida;
    }

    // --- Handlers ---
    const actualizaNombreCliente = (e) => { setNombreCliente(e.target.value); }
    const actualizaTelefonoCliente = (e) => { setTelefono(e.target.value); }
    const actualizaCorreoCliente = (e) => { setCorreo(e.target.value); }
    const actualizaUsername = (e) => setUsername(e.target.value);

    const handleBlur = (field) => { // Para validación al salir del campo
        setTouched(prev => ({ ...prev, [field]: true }));
        validaForm(); // Re-valida el formulario
    };

    // Función para regresar a la lista (Lógica del botón Cancelar)
    function regresar() {
        navegar('/cliente');
    }

    // --- Efecto para Cargar Datos en Modo Edición ---
    useEffect(() => {
        if (id) {
            getCliente(id).then((res) => {
                setNombreCliente(res.data.nombreCliente);
                setTelefono(res.data.telefono);
                setCorreo(res.data.correo);
                setUsername(res.data.username || "");
            }).catch((error) => {
                console.error("Error al cargar el cliente:", error);
                setErrors({ api: "No se pudo cargar la información del cliente." });
            });
        }
    }, [id]);

    // --- Título Dinámico ---
    function pageTitulo() {
        return id ? "Actualizar Cliente" : "Registrar Cliente";
    }

    // --- Guardar/Actualizar Cliente ---
    async function saveCliente(e) {
        e.preventDefault();
        
        // Marcar todos los campos como "tocados" para mostrar errores
        setTouched({ nombreCliente: true, telefono: true, correo: true, username: !id });

        if (!validaForm()) {
            Swal.fire('Formulario incompleto', 'Por favor, completa todos los campos obligatorios.', 'error');
            return;
        }

        // --- LÓGICA DE EDICIÓN (Modo 'id' existe) ---
        // (Esto solo actualiza el perfil en 'restaurantes-service')
        if (id) {
            const cliente = { nombreCliente, telefono, correo, username };
            try {
                await updateCliente(id, cliente);
                Swal.fire('¡Éxito!', 'Cliente actualizado con éxito.', 'success');
                navegar('/cliente');
            } catch (error) {
                // ... (tu error handling)
            }
        } 
        // --- LÓGICA DE CREACIÓN (Modo 'id' NO existe) ---
        // (¡Llama al 'auth-server' para orquestar todo!)
        else {
            
            // 1. Construir el DTO para 'create-assisted'
            const requestData = {
                username: username.trim(),
                roleName: "ROLE_CLIENTE", // ¡Fijamos el rol!
                
                // Datos para el perfil de cliente
                nombreCliente: nombreCliente.trim(),
                telefono: telefono.trim(),
                correo: correo.trim(),
                
                // Datos de empleado van nulos
                nombreEmpleado: null,
                puestoEmpleado: null
            };

            try {
                // 2. Llamar al servicio de autenticación
                const response = await AuthService.crearEmpleadoAsistido(requestData);
                
                // 3. ¡Mostrar la contraseña temporal al empleado!
                await Swal.fire({
                    title: `¡Cliente Registrado!`,
                    icon: 'success',
                    html: `
                        <div class="text-start">
                            <p>Se ha creado el perfil y la cuenta de login:</p>
                            <hr>
                            <p><strong>Usuario:</strong> ${response.data.username}</p>
                            <p class="mb-0"><strong>Contraseña Temporal:</strong></p>
                            <h4 class="text-primary fw-bold">${response.data.temporaryPassword}</h4>
                            <small class="text-muted">El cliente deberá usar esta contraseña para su primer inicio de sesión.</small>
                        </div>
                    `,
                    confirmButtonColor: '#3E6770',
                    confirmButtonText: '¡Entendido!'
                });

                navegar('/cliente');

            } catch (error) {
                console.error("Error al crear cliente:", error);
                const mensajeError = error.response?.data || "Error al crear el cliente. Verifique el log.";
                Swal.fire('Error', mensajeError, 'error');
            }
        }
    }

    return (
        <div className="page-wrap">
            <div className="container">
                <div className="row justify-content-center">
                    {/* Contenedor centralizado para el formulario */}
                    <div className="col-lg-8 col-md-10">
                        <div className="card-custom">
                            <div className="card-header">
                                <h2 className="card-title">{pageTitulo()}</h2>
                            </div>
                            <div className="card-body p-4"> {/* Agrega padding aquí */}
                                <form onSubmit={saveCliente} noValidate>
                                    
                                    {/* Mensaje de error de API */}
                                    {errors.api && (
                                        <div className="alert alert-danger mb-4 d-flex align-items-center" role="alert">
                                            <X size={20} className="me-2" />
                                            {errors.api}
                                        </div>
                                    )}

                                    {/* 1. Nombre del Cliente */}
                                    <div className="form-group mb-3">
                                        <label htmlFor="nombre" className="form-label d-flex align-items-center">
                                            <User size={18} className="me-2" /> Nombre del cliente
                                        </label>
                                        <input
                                            id="nombre" name="nombre" type="text"
                                            className={`form-control ${errors.nombreCliente ? 'is-invalid' : ''}`}
                                            value={nombreCliente} onChange={actualizaNombreCliente}
                                            onBlur={() => handleBlur('nombreCliente')}
                                            placeholder="Ej. Ana García"
                                        />
                                        {errors.nombreCliente && <div className="invalid-feedback">{errors.nombreCliente}</div>}
                                    </div>

                                    {/* --- ¡NUEVO CAMPO: USERNAME! --- */}
                                    {/* (El Admin no puede cambiar el username de un cliente existente) */}
                                    <div className="form-group mb-3">
                                        <label htmlFor="username" className="form-label d-flex align-items-center">
                                            <AtSign size={18} className="me-2" />
                                            Nombre de Usuario (para Login)
                                        </label>
                                        <input
                                            id="username" name="username" type="text"
                                            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                            value={username} 
                                            onChange={actualizaUsername}
                                            onBlur={() => handleBlur('username')}
                                            placeholder={id ? "(No se puede editar)" : "Ej. ana.garcia"}
                                            disabled={!!id} // <-- Deshabilitado en modo edición
                                        />
                                        {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                                        <small className="form-text text-muted">
                                            {id ? "El nombre de usuario no se puede cambiar." : "El cliente usará esto para iniciar sesión."}
                                        </small>
                                    </div>

                                    {/* 2. Teléfono */}
                                    <div className="form-group mb-3">
                                        <label htmlFor="telefono" className="form-label d-flex align-items-center">
                                            <Phone size={18} className="me-2" />
                                            Número de teléfono
                                        </label>
                                        <input
                                            id="telefono"
                                            name="telefono"
                                            type="tel"
                                            className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                                            value={telefono}
                                            onChange={actualizaTelefonoCliente}
                                            placeholder="Ej. 5512345678"
                                            aria-label="Número de teléfono"
                                        />
                                        {errors.telefono && 
                                            <div className="invalid-feedback">{errors.telefono}</div>
                                        }
                                    </div>

                                    {/* 3. Correo Electrónico */}
                                    <div className="form-group mb-4">
                                        <label htmlFor="correo" className="form-label d-flex align-items-center">
                                            <Mail size={18} className="me-2" />
                                            Correo electrónico
                                        </label>
                                        <input
                                            id="correo"
                                            name="correo"
                                            type="email"
                                            className={`form-control ${errors.correo ? 'is-invalid' : ''}`}
                                            value={correo}
                                            onChange={actualizaCorreoCliente}
                                            placeholder="ejemplo@dominio.com"
                                            aria-label="Correo electrónico"
                                        />
                                        {errors.correo && 
                                            <div className="invalid-feedback">{errors.correo}</div>
                                        }
                                    </div>

                                    {/* 4. Botones de Acción */}
                                    <div className="form-actions border-top pt-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-rosa"
                                            onClick={regresar} // Llama a la función de redirección
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-rosa ms-2"
                                        >
                                            {id ? "Actualizar Cliente" : "Guardar Cliente"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClienteComponent;