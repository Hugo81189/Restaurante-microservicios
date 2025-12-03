import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from 'sweetalert2';
import AuthService from "../services/AuthService";
import { getEmpleadoById, crearEmpleado, updateEmpleado } from "../services/EmpleadoService";
import { 
    User, Save, X, ArrowLeft, Briefcase, UserCheck, 
    Building2, Eye, RotateCcw, AlertCircle, CheckCircle,
    AtSign // Icono agregado para el campo de username
} from "lucide-react";

export const EmpleadoComponent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Estados del formulario
    const [formData, setFormData] = useState({
        nombre: "",
        puesto: "",
        username: "",
        estado: "ACTIVO"
    });
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Opciones disponibles
    const puestos = ["MESERO", "CAJERO", "ADMINISTRADOR", "SUPERVISOR"];
    const estados = ["ACTIVO", "INACTIVO"];

    const getPuestoInfo = (puesto) => {
        const puestosInfo = {
            'ADMINISTRADOR': { color: '#1e40af', bgColor: '#dbeafe' },
            'SUPERVISOR': { color: '#0e7490', bgColor: '#d1f5f3' },
            'MESERO': { color: '#065f46', bgColor: '#d1fae5' },
            'CAJERO': { color: '#9a3412', bgColor: '#ffedd5' },
        };
        return puestosInfo[puesto] || { color: '#6b7280', bgColor: '#f9fafb' };
    };

    useEffect(() => {
        if (id) {
            cargarEmpleadoExistente();
        }
    }, [id]);

    const cargarEmpleadoExistente = () => {
        setLoading(true);
        getEmpleadoById(id)
            .then((response) => {
                const empleado = response.data;
                setFormData({
                    nombre: empleado.nombre,
                    puesto: empleado.puesto,
                    estado: empleado.estado,
                    username: empleado.username || ""
                });
            })
            .catch((error) => {
                console.error("Error al cargar empleado:", error);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo cargar la información del empleado.',
                    icon: 'error',
                    confirmButtonColor: '#3E6770'
                });
                navigate('/empleado');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Marcar como tocado
        setTouched(prev => ({
            ...prev,
            [field]: true
        }));

        // Limpiar error si se corrige
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({
            ...prev,
            [field]: true
        }));
        validarCampo(field, formData[field]);
    };

    const validarCampo = (field, value) => {
        let error = "";

        switch (field) {
            case 'nombre':
                if (!value || value.trim() === "") {
                    error = "El nombre es requerido";
                } else if (value.trim().length < 2) {
                    error = "El nombre debe tener al menos 2 caracteres";
                } else if (value.trim().length > 100) {
                    error = "El nombre no puede exceder 100 caracteres";
                }
                break;
                
            case 'puesto':
                if (!value || value.trim() === "") {
                    error = "El puesto es requerido";
                }
                break;

            case 'username':
                if (!value || value.trim() === "") error = "El nombre de usuario es requerido";
                else if (value.trim().length < 3) error = "Debe tener al menos 3 caracteres";
                else if (/\s/.test(value)) error = "No puede contener espacios";
                break;
        }

        setErrors(prev => ({
            ...prev,
            [field]: error
        }));

        return !error;
    };

    const validarFormulario = () => {
        const camposRequeridos = id ? ['nombre', 'puesto', 'username'] : ['nombre', 'puesto', 'username'];
        let esValido = true;
        const nuevosErrores = {};

        camposRequeridos.forEach(campo => {
            if (!validarCampo(campo, formData[campo])) {
                esValido = false;
                nuevosErrores[campo] = errors[campo]|| "Este campo es requerido.";
            }
        });

        setErrors(nuevosErrores);
        return esValido;
    };

    const mapPuestoToRoleName = (puesto) => {
        // Asegura que el puesto (ej. "MESERO") se convierta en "ROLE_MESERO"
        if (!puesto) return null;
        return `ROLE_${puesto.toUpperCase()}`;
    }

    const guardarEmpleado = async (e) => {
        e.preventDefault();

        // Marcar todos los campos como tocados
        const todosLosCampos = { nombre: true, puesto: true, username: true };
        setTouched(todosLosCampos);

        if (!validarFormulario()) {
            Swal.fire({
                title: 'Formulario incompleto',
                text: 'Por favor corrige los errores marcados en el formulario.',
                icon: 'warning',
                confirmButtonColor: '#3E6770'
            });
            return;
        }

        setSaving(true);

        if (id) {
            const empleadoDto = {
                nombre: formData.nombre.trim(),
                puesto: formData.puesto,
                estado: formData.estado,
                username: formData.username.trim() // <-- Añadido username
            };
            
            try {
                await updateEmpleado(id, empleadoDto); // Llama al servicio de Empleado
                await Swal.fire('¡Éxito!', 'Empleado actualizado correctamente.', 'success');
                navigate('/empleado');
            } catch (error) {
                console.error("Error al actualizar empleado:", error);
                Swal.fire('Error', 'No se pudo actualizar el empleado.', 'error');
            } finally {
                setSaving(false);
            }

        } 
        // --- LÓGICA DE CREACIÓN (nueva, llama a auth-server) ---
        else {
            
            // 1. Construir el DTO para 'create-assisted'
            const requestData = {
                username: formData.username.trim(),
                roleName: mapPuestoToRoleName(formData.puesto),
                nombreEmpleado: formData.nombre.trim(),
                puestoEmpleado: formData.puesto,
                
                // Campos de cliente van nulos
                nombreCliente: null,
                telefono: null,
                correo: null
            };

            try {
                // 2. Llamar al servicio de autenticación
                const response = await AuthService.crearEmpleadoAsistido(requestData);
                
                // 3. ¡Mostrar la contraseña temporal al Admin!
                await Swal.fire({
                    title: `¡Empleado Registrado!`,
                    icon: 'success',
                    html: `
                        <div class="text-start">
                            <p>Se ha creado el perfil y la cuenta de login:</p>
                            <hr>
                            <p><strong>Usuario:</strong> ${response.data.username}</p>
                            <p class="mb-0"><strong>Contraseña Temporal:</strong></p>
                            <h4 class="text-primary fw-bold">${response.data.temporaryPassword}</h4>
                            <small class="text-muted">El empleado deberá usar esta contraseña para su primer inicio de sesión.</small>
                        </div>
                    `,
                    confirmButtonColor: '#3E6770',
                    confirmButtonText: '¡Entendido!'
                });

                navigate('/empleado');

            } catch (error) {
                console.error("Error al crear empleado:", error);
                const mensajeError = error.response?.data || "Error al crear el empleado. Verifique el log.";
                Swal.fire('Error', mensajeError, 'error');
            } finally {
                setSaving(false);
            }
        }
    };

    const cancelar = () => {
        Swal.fire({
            title: '¿Cancelar cambios?',
            text: id ? 'Los cambios no guardados se perderán.' : 'La información ingresada se perderá.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3E6770',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'Seguir editando'
        }).then((result) => {
            if (result.isConfirmed) {
                navigate('/empleado');
            }
        });
    };

    const resetForm = () => {
        Swal.fire({
            title: '¿Restablecer formulario?',
            text: 'Todos los campos se limpiarán y se perderán los cambios.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3E6770',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, restablecer',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                setFormData({
                    nombre: "",
                    puesto: "",
                    estado: "ACTIVO"
                });
                setErrors({});
                setTouched({});
            }
        });
    };

    const mostrarVistaPrevia = () => {
        const puestoInfo = getPuestoInfo(formData.puesto);

        Swal.fire({
            title: `Vista Previa - ${formData.nombre || 'Nuevo Empleado'}`,
            html: `
                <div class="text-start">
                    <div class="row">
                        <div class="col-6">
                            <strong>Nombre:</strong>
                        </div>
                        <div class="col-6">
                            ${formData.nombre || 'No definido'}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>Puesto:</strong>
                        </div>
                        <div class="col-6">
                            ${formData.puesto ? `
                                <span style="color: ${puestoInfo.color}; background: ${puestoInfo.bgColor}; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">
                                    ${formData.puesto}
                                </span>
                            ` : 'No definido'}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>Estado:</strong>
                        </div>
                        <div class="col-6">
                            <span style="color: #10b981; font-weight: 600;">
                                ${id ? formData.estado : 'ACTIVO (por defecto)'}
                            </span>
                        </div>
                    </div>
                </div>
            `,
            icon: 'info',
            confirmButtonColor: '#3E6770',
            confirmButtonText: 'Entendido'
        });
    };

    if (loading && id) {
        return (
            <div className="page-wrap">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                                    <span className="visually-hidden">Cargando...</span>
                                </div>
                                <p className="mt-3 text-muted">Cargando información del empleado...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const puestoInfo = getPuestoInfo(formData.puesto);

    return (
        <div className="page-wrap">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-8 col-xl-7">
                        {/* Header Mejorado */}
                        <div className="form-header mb-4">
                            <div className="header-content">
                                <div className="header-title-section">
                                    <div className="header-icon">
                                        <User size={32} />
                                    </div>
                                    <div>
                                        <h1 className="form-title">
                                            {id ? `Editar Empleado` : 'Registrar Nuevo Empleado'}
                                        </h1>
                                        <p className="form-subtitle">
                                            {id ? 'Modifica la información del empleado existente' : 'Agrega un nuevo miembro al equipo del restaurante'}
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Tarjeta del Formulario */}
                        <div className="card-custom form-card">
                            <div className="card-body p-4">
                                <form onSubmit={guardarEmpleado} noValidate>
                                    <div className="row g-4">
                                        {/* Nombre */}
                                        <div className="col-12">
                                            <label htmlFor="nombre" className="form-label">
                                                <User size={16} className="me-1" />
                                                Nombre Completo *
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${touched.nombre && errors.nombre ? 'is-invalid' : ''} ${touched.nombre && !errors.nombre ? 'is-valid' : ''}`}
                                                id="nombre"
                                                value={formData.nombre}
                                                onChange={(e) => handleInputChange('nombre', e.target.value)}
                                                onBlur={() => handleBlur('nombre')}
                                                placeholder="Ej: Juan Pérez García"
                                                maxLength="100"
                                                required
                                            />
                                            {touched.nombre && errors.nombre && (
                                                <div className="invalid-feedback d-block">
                                                    <AlertCircle size={14} className="me-1" />
                                                    {errors.nombre}
                                                </div>
                                            )}
                                            {touched.nombre && !errors.nombre && formData.nombre && (
                                                <div className="valid-feedback d-block">
                                                    <CheckCircle size={14} className="me-1" />
                                                    Nombre válido
                                                </div>
                                            )}
                                            <div className="form-text">
                                                Nombre completo del empleado (máximo 100 caracteres)
                                            </div>
                                        </div>

                                        {/* --- ¡NUEVO CAMPO: USERNAME! --- */}
                                        {/* Solo se muestra en CREACIÓN. No se puede editar. */}
                                        {!id && (
                                            <div className="col-12">
                                                <label htmlFor="username" className="form-label">
                                                    <AtSign size={16} className="me-1" />
                                                    Nombre de Usuario (para Login) *
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${touched.username && errors.username ? 'is-invalid' : ''} ${touched.username && !errors.username ? 'is-valid' : ''}`}
                                                    id="username"
                                                    value={formData.username}
                                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                                    onBlur={() => handleBlur('username')}
                                                    placeholder="Ej: j.perez"
                                                    maxLength="50"
                                                    required
                                                />
                                                {touched.username && errors.username && (
                                                    <div className="invalid-feedback d-block">
                                                        <AlertCircle size={14} className="me-1" />
                                                        {errors.username}
                                                    </div>
                                                )}
                                                <div className="form-text">
                                                    Este será el usuario con el que el empleado iniciará sesión. No puede tener espacios.
                                                </div>
                                            </div>
                                        )}

                                        {/* Puesto */}
                                        <div className="col-md-6">
                                            <label htmlFor="puesto" className="form-label">
                                                <Briefcase size={16} className="me-1" />
                                                Puesto *
                                            </label>
                                            <select
                                                className={`form-control ${touched.puesto && errors.puesto ? 'is-invalid' : ''} ${touched.puesto && !errors.puesto ? 'is-valid' : ''}`}
                                                id="puesto"
                                                value={formData.puesto}
                                                onChange={(e) => handleInputChange('puesto', e.target.value)}
                                                onBlur={() => handleBlur('puesto')}
                                                required
                                            >
                                                <option value="">-- Selecciona un puesto --</option>
                                                {puestos.map((puestoOption) => (
                                                    <option key={puestoOption} value={puestoOption}>
                                                        {puestoOption}
                                                    </option>
                                                ))}
                                            </select>
                                            {touched.puesto && errors.puesto && (
                                                <div className="invalid-feedback d-block">
                                                    <AlertCircle size={14} className="me-1" />
                                                    {errors.puesto}
                                                </div>
                                            )}
                                            {touched.puesto && !errors.puesto && formData.puesto && (
                                                <div className="valid-feedback d-block">
                                                    <CheckCircle size={14} className="me-1" />
                                                    Puesto seleccionado
                                                </div>
                                            )}
                                            <div className="form-text">
                                                Rol del empleado en el restaurante
                                            </div>
                                        </div>

                                        {/* Estado - SOLO en modo edición */}
                                        {id && (
                                            <div className="col-md-6">
                                                <label htmlFor="estado" className="form-label">
                                                    <UserCheck size={16} className="me-1" />
                                                    Estado
                                                </label>
                                                <select
                                                    className="form-control"
                                                    id="estado"
                                                    value={formData.estado}
                                                    onChange={(e) => handleInputChange('estado', e.target.value)}
                                                >
                                                    {estados.map((estadoOption) => (
                                                        <option key={estadoOption} value={estadoOption}>
                                                            {estadoOption}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="form-text">
                                                    Los empleados inactivos no podrán ser asignados a nuevas actividades.
                                                </div>
                                            </div>
                                        )}

                                        {/* Información de estado en modo creación */}
                                        {!id && (
                                            <div className="col-12">
                                                <div className="alert alert-info py-2">
                                                    <div className="d-flex align-items-center">
                                                        <UserCheck size={16} className="me-2 flex-shrink-0" />
                                                        <div>
                                                            <strong>Estado inicial:</strong> ACTIVO
                                                            <br />
                                                            <small className="text-muted">
                                                                Los nuevos empleados se registran automáticamente como activos. 
                                                                El estado puede modificarse posteriormente en la edición.
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="form-actions border-top pt-4 mt-4">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <button
                                                type="button"
                                                className="btn btn-outline-rosa"
                                                onClick={cancelar}
                                                disabled={saving}
                                            >
                                                <ArrowLeft size={16} className="me-1" />
                                                Volver al Listado
                                            </button>
                                            
                                            <div className="d-flex gap-2">
                                                {!id && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={resetForm}
                                                        disabled={saving}
                                                    >
                                                        <RotateCcw size={16} className="me-1" />
                                                        Limpiar
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    className="btn btn-rosa"
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <>
                                                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                                                <span className="visually-hidden">Guardando...</span>
                                                            </div>
                                                            {id ? 'Actualizando...' : 'Registrando...'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save size={16} className="me-1" />
                                                            {id ? 'Actualizar Empleado' : 'Registrar Empleado'}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
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

export default EmpleadoComponent;