import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from 'sweetalert2';
import { listMesas, getMesaById, crearMesa, updateMesa } from "../services/MesaService";
import {
    Table, Save, X, ArrowLeft, MapPin, Users,
    CheckCircle, Clock, AlertCircle, XCircle,
    Building2, Eye, RotateCcw
} from "lucide-react";

export const MesaComponent = () => {
    const [mesasExistentes, setMesasExistentes] = useState([]);
    const [validandoNumero, setValidandoNumero] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    // Estados del formulario
    const [formData, setFormData] = useState({
        numero: "",
        capacidad: "",
        ubicacion: "",
        estado: "DISPONIBLE",
        descripcion: ""
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Opciones predefinidas
    const estados = [
        { value: "DISPONIBLE", label: "Disponible", icon: CheckCircle, color: "#10b981" },
        { value: "OCUPADA", label: "Ocupada", icon: Clock, color: "#ef4444" },
        { value: "RESERVADA", label: "Reservada", icon: AlertCircle, color: "#f59e0b" },
        { value: "MANTENIMIENTO", label: "Mantenimiento", icon: XCircle, color: "#6b7280" }
    ];

    const ubicacionesComunes = [
        "Terraza Jardín",
        "Salón Principal",
        "Barra",
        "Jardín Interior",
        "Sala VIP",
        "Terraza Superior",
        "Comedor Familiar",
        "Zona Privada"
    ];

    useEffect(() => {
        cargarMesasExistentes();

        if (id) {
            cargarMesaExistente();
        }
    }, [id]);

    const cargarMesasExistentes = () => {
        listMesas()
            .then((response) => {
                setMesasExistentes(response.data || []);
            })
            .catch((error) => {
                console.error("Error al cargar mesas existentes:", error);
                // No mostrar error al usuario, solo log en consola
            });
    };

    const cargarMesaExistente = () => {
        setLoading(true);
        getMesaById(id)
            .then((response) => {
                const mesa = response.data;
                setFormData({
                    numero: mesa.numero.toString(),
                    capacidad: mesa.capacidad.toString(),
                    ubicacion: mesa.ubicacion,
                    estado: mesa.estado,
                    descripcion: mesa.descripcion || ""
                });
            })
            .catch((error) => {
                console.error("Error al cargar mesa:", error);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo cargar la información de la mesa.',
                    icon: 'error',
                    confirmButtonColor: '#3E6770'
                });
                navigate('/mesa');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleInputChange = async (field, value) => {
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

        // Validación en tiempo real para número
        if (field === 'numero' && value) {
            setValidandoNumero(true);
            const errorNumero = await validarNumeroUnico(value);
            setErrors(prev => ({
                ...prev,
                numero: errorNumero
            }));
            setValidandoNumero(false);
        } else if (errors[field]) {
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

    const validarCampo = async (field, value) => {
        let error = "";

        switch (field) {
            
            case 'numero':
                if (!value || value.trim() === "") {
                    error = "El número de mesa es requerido";
                } else if (parseInt(value) < 1) {
                    error = "El número debe ser mayor a 0";
                } else if (!/^\d+$/.test(value)) {
                    error = "Solo se permiten números enteros";
                } else {
                    // Validar unicidad
                    error = await validarNumeroUnico(value);
                }
                break;

            case 'capacidad':
                if (!value || value.trim() === "") {
                    error = "La capacidad es requerida";
                } else if (parseInt(value) < 1) {
                    error = "La capacidad debe ser mayor a 0";
                } else if (parseInt(value) > 20) {
                    error = "La capacidad máxima es 20 personas";
                } else if (!/^\d+$/.test(value)) {
                    error = "Solo se permiten números enteros";
                }
                break;

            case 'ubicacion':
                if (!value || value.trim() === "") {
                    error = "La ubicación es requerida";
                } else if (value.length < 2) {
                    error = "La ubicación debe tener al menos 2 caracteres";
                }
                break;

            case 'descripcion':
                if (value.length > 200) {
                    error = "La descripción no puede exceder 200 caracteres";
                }
                break;

        }

        setErrors(prev => ({
            ...prev,
            [field]: error
        }));

        return !error;
    };

    // Validación en tiempo real del número
    const validarNumeroUnico = async (numero) => {
        if (!numero || numero.trim() === "") return "";

        const numeroInt = parseInt(numero);

        // En modo edición, excluir la mesa actual
        const mesasAValidar = id
            ? mesasExistentes.filter(m => m.id !== parseInt(id))
            : mesasExistentes;

        const mesaExistente = mesasAValidar.find(m => m.numero === numeroInt);

        if (mesaExistente) {
            return `Ya existe la mesa #${numeroInt} en ${mesaExistente.ubicacion}`;
        }

        return "";
    };

    const validarFormulario = () => {
        const camposRequeridos = ['numero', 'capacidad', 'ubicacion'];
        let esValido = true;
        const nuevosErrores = {};

        camposRequeridos.forEach(campo => {
            if (!validarCampo(campo, formData[campo])) {
                esValido = false;
                nuevosErrores[campo] = errors[campo];
            }
        });

        setErrors(nuevosErrores);
        return esValido;
    };

    const getEstadoInfo = (estadoValue) => {
        return estados.find(e => e.value === estadoValue) || estados[0];
    };

    const guardarMesa = async (e) => {
        e.preventDefault();

        // Marcar todos los campos como tocados
        const todosLosCampos = {
            numero: true,
            capacidad: true,
            ubicacion: true,
            descripcion: true
        };
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

        const mesaDto = {
            numero: parseInt(formData.numero),
            capacidad: parseInt(formData.capacidad),
            ubicacion: formData.ubicacion.trim(),
            estado: id ? formData.estado : 'DISPONIBLE',
            descripcion: formData.descripcion.trim()
        };

        try {
            const operacion = id ? updateMesa(id, mesaDto) : crearMesa(mesaDto);
            await operacion;

            const accion = id ? "actualizada" : "creada";
            const estadoInfo = getEstadoInfo(mesaDto.estado);
            const EstadoIcon = estadoInfo.icon;

            await Swal.fire({
                title: `¡Éxito!`,
                html: `
                    <div class="text-center">
                        <div class="mb-3" style="color: ${estadoInfo.color}">
                            <${EstadoIcon.name} size="48" />
                        </div>
                        <h4>Mesa ${accion} correctamente</h4>
                        <p class="text-muted">
                            Mesa #${mesaDto.numero} - ${mesaDto.ubicacion}<br/>
                            <strong>Estado:</strong> ${estadoInfo.label}
                        </p>
                    </div>
                `,
                icon: 'success',
                confirmButtonColor: '#3E6770',
                confirmButtonText: 'Volver al listado'
            });

            navigate('/mesa');
        } catch (error) {
            console.error("Error al guardar mesa:", error);
            const mensajeError = error.response?.data || `Error al ${id ? 'actualizar' : 'crear'} la mesa.`;

            Swal.fire({
                title: 'Error',
                text: mensajeError,
                icon: 'error',
                confirmButtonColor: '#3E6770'
            });
        } finally {
            setSaving(false);
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
                navigate('/mesa');
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
                    numero: "",
                    capacidad: "",
                    ubicacion: "",
                    estado: "DISPONIBLE",
                    descripcion: ""
                });
                setErrors({});
                setTouched({});
            }
        });
    };

    const mostrarVistaPrevia = () => {
        const estadoInfo = getEstadoInfo(formData.estado);
        const EstadoIcon = estadoInfo.icon;

        Swal.fire({
            title: `Vista Previa - Mesa #${formData.numero || '?'}`,
            html: `
                <div class="text-start">
                    <div class="row">
                        <div class="col-6">
                            <strong>Número:</strong>
                        </div>
                        <div class="col-6">
                            ${formData.numero || 'No definido'}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>Capacidad:</strong>
                        </div>
                        <div class="col-6">
                            ${formData.capacidad ? formData.capacidad + ' personas' : 'No definida'}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>Ubicación:</strong>
                        </div>
                        <div class="col-6">
                            ${formData.ubicacion || 'No definida'}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>Estado:</strong>
                        </div>
                        <div class="col-6">
                            <span style="color: ${estadoInfo.color}">
                                <i class="fas fa-circle me-1"></i>
                                ${estadoInfo.label}
                            </span>
                        </div>
                    </div>
                    ${formData.descripcion ? `
                    <div class="row mt-2">
                        <div class="col-12">
                            <strong>Descripción:</strong><br/>
                            <small class="text-muted">${formData.descripcion}</small>
                        </div>
                    </div>
                    ` : ''}
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
                                <p className="mt-3 text-muted">Cargando información de la mesa...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const estadoActual = getEstadoInfo(formData.estado);
    const EstadoIcon = estadoActual.icon;

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
                                        <Building2 size={32} />
                                    </div>
                                    <div>
                                        <h1 className="form-title">
                                            {id ? `Editar Mesa #${formData.numero}` : 'Crear Nueva Mesa'}
                                        </h1>
                                        <p className="form-subtitle">
                                            {id ? 'Modifica la información de la mesa existente' : 'Registra una nueva mesa en el restaurante'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tarjeta del Formulario */}
                        <div className="card-custom form-card">
                            <div className="card-body p-4">
                                <form onSubmit={guardarMesa} noValidate>
                                    <div className="row g-4">
                                        {/* Número de Mesa */}
                                        <div className="col-md-6">
                                            <label htmlFor="numero" className="form-label">
                                                Número de Mesa *
                                                {validandoNumero && (
                                                    <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                        <span className="visually-hidden">Validando...</span>
                                                    </div>
                                                )}
                                            </label>
                                            <input
                                                type="number"
                                                className={`form-control ${touched.numero && errors.numero ? 'is-invalid' : ''} ${touched.numero && !errors.numero && !validandoNumero ? 'is-valid' : ''}`}
                                                id="numero"
                                                value={formData.numero}
                                                onChange={(e) => handleInputChange('numero', e.target.value)}
                                                onBlur={() => handleBlur('numero')}
                                                min="1"
                                                max="999"
                                                placeholder="Ej: 1, 2, 3..."
                                                required
                                            />

                                            {/* Mensaje de error */}
                                            {touched.numero && errors.numero && (
                                                <div className="invalid-feedback d-block">
                                                    <AlertCircle size={14} className="me-1" />
                                                    {errors.numero}
                                                </div>
                                            )}

                                            {/* 💡 MENSAJE DE ÉXITO - Agregar también este bloque */}
                                            {touched.numero && !errors.numero && !validandoNumero && formData.numero && (
                                                <div className="valid-feedback d-block">
                                                    <CheckCircle size={14} className="me-1" />
                                                    Número de mesa disponible
                                                </div>
                                            )}

                                            <div className="form-text">
                                                Número único que identifica la mesa
                                            </div>
                                        </div>

                                        {/* Capacidad */}
                                        <div className="col-md-6">
                                            <label htmlFor="capacidad" className="form-label">
                                                <Users size={16} className="me-1" />
                                                Capacidad (personas) *
                                            </label>
                                            <input
                                                type="number"
                                                className={`form-control ${touched.capacidad && errors.capacidad ? 'is-invalid' : ''} ${touched.capacidad && !errors.capacidad ? 'is-valid' : ''}`}
                                                id="capacidad"
                                                value={formData.capacidad}
                                                onChange={(e) => handleInputChange('capacidad', e.target.value)}
                                                onBlur={() => handleBlur('capacidad')}
                                                min="1"
                                                max="20"
                                                placeholder="Ej: 2, 4, 6..."
                                                required
                                            />
                                            {touched.capacidad && errors.capacidad && (
                                                <div className="invalid-feedback d-block">{errors.capacidad}</div>
                                            )}
                                            <div className="form-text">
                                                Máximo 20 personas por mesa
                                            </div>
                                        </div>

                                        {/* Ubicación */}
                                        <div className="col-12">
                                            <label htmlFor="ubicacion" className="form-label">
                                                <MapPin size={16} className="me-1" />
                                                Ubicación *
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${touched.ubicacion && errors.ubicacion ? 'is-invalid' : ''} ${touched.ubicacion && !errors.ubicacion ? 'is-valid' : ''}`}
                                                id="ubicacion"
                                                value={formData.ubicacion}
                                                onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                                                onBlur={() => handleBlur('ubicacion')}
                                                list="ubicaciones-sugeridas"
                                                placeholder="Ej: Terraza Jardín, Salón Principal..."
                                                required
                                            />
                                            <datalist id="ubicaciones-sugeridas">
                                                {ubicacionesComunes.map((ubicacion, index) => (
                                                    <option key={index} value={ubicacion} />
                                                ))}
                                            </datalist>
                                            {touched.ubicacion && errors.ubicacion && (
                                                <div className="invalid-feedback d-block">{errors.ubicacion}</div>
                                            )}
                                            <div className="form-text">
                                                Zona del restaurante donde se encuentra la mesa
                                            </div>
                                        </div>


                                        {/* Estado */}
                                        <div className="col-12">
                                            <label htmlFor="estado" className="form-label">
                                                Estado de la Mesa
                                            </label>
                                            <div className="estado-selector">
                                                <select
                                                    className="form-control"
                                                    id="estado"
                                                    value={formData.estado}
                                                    onChange={(e) => handleInputChange('estado', e.target.value)}
                                                    disabled={!id}
                                                >
                                                    {estados.map((estadoOption) => (
                                                        <option key={estadoOption.value} value={estadoOption.value}>
                                                            {estadoOption.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="estado-preview mt-2">
                                                    <div
                                                        className="estado-badge"
                                                        style={{
                                                            backgroundColor: estadoActual.color + '20',
                                                            color: estadoActual.color,
                                                            borderColor: estadoActual.color
                                                        }}
                                                    >
                                                        <EstadoIcon size={14} className="me-1" />
                                                        {estadoActual.label}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-text">
                                                {id
                                                    ? "El estado determina la disponibilidad actual de la mesa"
                                                    : "Las nuevas mesas se crean automáticamente como DISPONIBLE"
                                                }
                                            </div>
                                        </div>
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
                                                            {id ? 'Actualizando...' : 'Creando...'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save size={16} className="me-1" />
                                                            {id ? 'Actualizar Mesa' : 'Crear Mesa'}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Información de Ayuda */}
                        <div className="help-info mt-4">
                            <div className="alert alert-info">
                                <div className="d-flex">
                                    <Table size={20} className="me-2 flex-shrink-0" />
                                    <div>
                                        <strong>Consejos para registrar mesas:</strong>
                                        <ul className="mb-0 mt-1">
                                            <li>Asigna números únicos para cada mesa</li>
                                            <li>Considera la capacidad según el tipo de cliente</li>
                                            <li>Usa ubicaciones descriptivas para fácil identificación</li>
                                            <li>Actualiza el estado según la disponibilidad real</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MesaComponent;