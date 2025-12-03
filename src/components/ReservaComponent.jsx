import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from 'sweetalert2';
import { getReservaById, crearReserva, updateReserva } from "../services/ReservaService";
import { listClientes, getClienteByUsername } from "../services/ClienteService";
import { listMesas } from "../services/MesaService";
import AuthService from "../services/AuthService";
import { Calendar, Clock, Save, X, ArrowLeft, User, Table, AlertCircle, Clock3, Ban } from "lucide-react";

export const ReservaComponent = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estados del formulario
    const [idCliente, setIdCliente] = useState("");
    const [idMesa, setIdMesa] = useState("");
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [estado, setEstado] = useState("PENDIENTE");
    const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
    const [mesasDisponibles, setMesasDisponibles] = useState([]);

    // Estados para datos externos
    const [clientes, setClientes] = useState([]);
    const [mesas, setMesas] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [errors, setErrors] = useState({});

    const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
    const [userRoles, setUserRoles] = useState(currentUser?.roles || []);

    const esCliente = userRoles.includes('ROLE_CLIENTE');

    // Estados disponibles SOLO para edición
    const estados = ["PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA"];

    // ✅ Función para interpretar "YYYY-MM-DD" como fecha local (no UTC)
    const parseLocalDate = (fechaStr) => {
        if (!fechaStr) return null;
        const [year, month, day] = fechaStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const handleSelection = (mesaId) => {
        setMesaSeleccionada(mesaId);
        Swal.fire('Mesa Seleccionada', `Mesa ID: ${mesaId} lista para reservar.`, 'success');
    };


    // ⬇️ CONFIGURACIÓN DE HORARIO DEL RESTAURANTE
    const configHorario = {
        horaApertura: "09:00",    // 9:00 AM
        horaCierre: "18:00",      // 6:00 PM
        intervaloMinutos: 15      // Reservas cada 15 minutos
    };

    // ⬇️ ESTADO PARA CONTROLAR SI EL DÍA ESTÁ BLOQUEADO
    const [diaBloqueado, setDiaBloqueado] = useState(false);
    const [mensajeBloqueo, setMensajeBloqueo] = useState("");

    // ⬇️ GENERAR HORARIOS DISPONIBLES CON LÓGICA INTELIGENTE
    const generarHorariosDisponibles = () => {
        // Si aún no se seleccionó una fecha, no generar horarios
        if (!fecha) return [];

        const fechaSeleccionada = parseLocalDate(fecha);
        if (!fechaSeleccionada || isNaN(fechaSeleccionada)) return []; // seguridad extra

        const ahora = new Date();
        const horaActual =
            String(ahora.getHours()).padStart(2, '0') + ':' +
            String(ahora.getMinutes()).padStart(2, '0');

        const hoy = new Date();
        const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const fechaSeleccionadaLocal = new Date(
            fechaSeleccionada.getFullYear(),
            fechaSeleccionada.getMonth(),
            fechaSeleccionada.getDate()
        );

        const [horaInicio, minutoInicio] = configHorario.horaApertura.split(':').map(Number);
        const [horaFin, minutoFin] = configHorario.horaCierre.split(':').map(Number);

        const horarios = [];
        let horaActualNum = horaInicio;
        let minutoActualNum = minutoInicio;

        const esHoy = fechaSeleccionadaLocal.getTime() === hoyLocal.getTime();

        while (horaActualNum < horaFin || (horaActualNum === horaFin && minutoActualNum <= minutoFin)) {
            const horaStr = String(horaActualNum).padStart(2, '0');
            const minutoStr = String(minutoActualNum).padStart(2, '0');
            const horarioCompleto = `${horaStr}:${minutoStr}`;

            if (esHoy) {
                if (horarioCompleto > horaActual) {
                    horarios.push(horarioCompleto);
                }
            } else {
                horarios.push(horarioCompleto);
            }

            // Avanzar 15 minutos
            minutoActualNum += configHorario.intervaloMinutos;
            if (minutoActualNum >= 60) {
                minutoActualNum = 0;
                horaActualNum++;
            }
        }

        return horarios;
    };


    // ⬇️ FUNCIÓN PARA VERIFICAR SI EL DÍA DEBE BLOQUEARSE
    const verificarDisponibilidadDelDia = () => {
        if (!fecha) return;

        const ahora = new Date();
        const horaActual = String(ahora.getHours()).padStart(2, '0') + ':' +
            String(ahora.getMinutes()).padStart(2, '0');

        const hoy = new Date();
        const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const fechaSeleccionada = parseLocalDate(fecha);
        const fechaSeleccionadaLocal = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate());

        const esHoy = fechaSeleccionadaLocal.getTime() === hoyLocal.getTime();

        if (esHoy) {
            // ⬇️ SI ES HOY Y YA PASÓ LA HORA DE CIERRE
            if (horaActual >= configHorario.horaCierre) {
                setDiaBloqueado(true);
                setMensajeBloqueo(`❌ Ya pasó la hora de cierre (${configHorario.horaCierre}) para hoy. No se pueden hacer reservas.`);
                setHora(""); // Limpiar hora seleccionada
            } else {
                setDiaBloqueado(false);
                setMensajeBloqueo("");
            }
        } else {
            setDiaBloqueado(false);
            setMensajeBloqueo("");
        }
    };

    const horariosDisponibles = generarHorariosDisponibles();

    // ⬇️ EFECTO PARA VERIFICAR DISPONIBILIDAD CUANDO CAMBIA LA FECHA
    useEffect(() => {
        verificarDisponibilidadDelDia();
    }, [fecha]);

    // ⬇️ FUNCIONES EXISTENTES (mantenerlas)
    const formatearFechaLocal = (fechaString) => {
        if (!fechaString) return '';
        const fechaLocal = parseLocalDate(fechaString);
        return fechaLocal.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getFechaMinima = () => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // ⬇️ FUNCIÓN PARA OBTENER EL MENSAJE DE HORARIOS DISPONIBLES
    const getMensajeHorarios = () => {
        if (!fecha) return "Selecciona una fecha para ver los horarios disponibles";

        const ahora = new Date();
        const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const fechaSeleccionada = parseLocalDate(fecha);
        const fechaSeleccionadaLocal = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate());

        if (fechaSeleccionadaLocal.getTime() === hoy.getTime()) {
            const horaActual = String(ahora.getHours()).padStart(2, '0') + ':' +
                String(ahora.getMinutes()).padStart(2, '0');
            return `Horarios disponibles a partir de las ${horaActual} (hora actual)`;
        } else {
            return `Horarios disponibles: ${configHorario.horaApertura} - ${configHorario.horaCierre}`;
        }
    };

    useEffect(() => {
        cargarDatosExternos();
    }, []);

    useEffect(() => {
        if (id) {
            cargarReservaExistente();
        }
    }, [id, clientes.length, mesas.length]);

    const cargarDatosExternos = async () => {
        try {
            setLoadingData(true);
            
            // 1. Cargar Mesas (Público para todos)
            const mesasRes = await listMesas();
            const mesasDisponibles = (mesasRes.data || []).filter(mesa =>
                mesa.estado === "DISPONIBLE" || mesa.estado === "RESERVADA"
            );
            setMesas(mesasDisponibles);

            // 2. LÓGICA DE CLIENTES (NUEVO)
            if (esCliente) {
                // Si soy cliente, no puedo listar todos. 
                // Busco MI propio perfil para obtener mi ID y Nombre.
                // Necesitas un método 'getClienteByUsername' en tu ClienteService
                const username = currentUser.sub; // 'sub' suele ser el username
                const miPerfilRes = await getClienteByUsername(username);
                
                // Pongo solo mi perfil en la lista para que el <select> funcione
                setClientes([miPerfilRes.data]);
                // Pre-selecciono mi ID
                setIdCliente(miPerfilRes.data.id);
                
            } else {
                // Si soy Staff, cargo la lista completa
                const clientesRes = await listClientes();
                setClientes(clientesRes.data || []);
            }

        } catch (error) {
            console.error("Error al cargar datos externos:", error);
            Swal.fire('Error', 'No se pudieron cargar clientes o mesas.', 'error');
        } finally {
            setLoadingData(false);
        }
    };

    const cargarReservaExistente = () => {
        if (clientes.length === 0 || mesas.length === 0) return;

        setLoading(true);
        getReservaById(id)
            .then((response) => {
                const reserva = response.data;
                setIdCliente(reserva.idCliente?.toString() || "");
                setIdMesa(reserva.idMesa?.toString() || "");
                setFecha(reserva.fecha);
                setHora(reserva.hora?.substring(0, 5) || "");
                setEstado(reserva.estado);
            })
            .catch((error) => {
                console.error("Error al cargar reserva:", error);
                Swal.fire('Error', 'No se pudo cargar la reserva.', 'error');
                navigate('/reserva');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        // ⬇️ CORREGIDO: Validación de fecha en zona local sin UTC
        const hoy = new Date();
        const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const fechaReserva = parseLocalDate(fecha);


        const fechaReservaLocal = new Date(fechaReserva.getFullYear(), fechaReserva.getMonth(), fechaReserva.getDate());

        if (!idCliente) {
            nuevosErrores.idCliente = "Debe seleccionar un cliente";
        }

        if (!idMesa) {
            nuevosErrores.idMesa = "Debe seleccionar una mesa";
        }

        if (!fecha) {
            nuevosErrores.fecha = "La fecha es requerida";
        } else if (fechaReservaLocal < hoyLocal) {
            nuevosErrores.fecha = "No se pueden hacer reservas en fechas pasadas";
        }

        if (!hora) {
            nuevosErrores.hora = "La hora es requerida";
        } else {
            // Validar que la hora esté dentro del horario permitido
            if (!horariosDisponibles.includes(hora)) {
                nuevosErrores.hora = `Horario no disponible. ${getMensajeHorarios()}`;
            }

            // ⬇️ CORREGIDO: Validar hora solo si la fecha es hoy
            if (fechaReservaLocal.getTime() === hoyLocal.getTime()) {
                const ahora = new Date();
                const horaActual = String(ahora.getHours()).padStart(2, '0') + ':' +
                    String(ahora.getMinutes()).padStart(2, '0');

                if (hora < horaActual) {
                    nuevosErrores.hora = "No se pueden hacer reservas en horas pasadas";
                }
            }
        }

        setErrors(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const guardarReserva = (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            Swal.fire('Error', 'Por favor corrige los errores del formulario.', 'error');
            return;
        }

        setLoading(true);

        // ⬇️ CORREGIR: Asegurar que la fecha se envíe exactamente como se seleccionó
        // El input type="date" ya envía en formato YYYY-MM-DD que es el correcto para LocalDate

        const estadoFinal = id ? estado : "PENDIENTE";

        const reservaDto = {
            idCliente: parseInt(idCliente),
            idMesa: parseInt(idMesa),
            fecha: fecha, // Mantener el formato YYYY-MM-DD
            hora: hora + ":00",
            estado: estadoFinal
        };

        console.log("📤 Enviando reserva al backend:", reservaDto);
        console.log("🔍 Debug fecha:", {
            fechaSeleccionada: fecha,
            tipo: typeof fecha,
            fechaJS: new Date(fecha),
            fechaISO: new Date(fecha).toISOString(),
            fechaLocal: new Date(fecha).toLocaleDateString('es-MX')
        });

        const operacion = id
            ? updateReserva(id, reservaDto)
            : crearReserva(reservaDto);

        operacion
            .then((response) => {
                console.log("✅ Respuesta del backend:", response.data);
                const accion = id ? "actualizada" : "creada";
                Swal.fire({
                    title: `¡Éxito!`,
                    text: `Reserva ${accion} correctamente. Fecha: ${response.data.fecha}`,
                    icon: 'success',
                    confirmButtonColor: '#3E6770'
                });
                navigate('/reserva');
            })
            .catch((error) => {
                console.error("❌ Error al guardar reserva:", error);
                const mensajeError = error.response?.data || `Error al ${id ? 'actualizar' : 'crear'} la reserva.`;

                let mensajeUsuario = mensajeError;
                if (mensajeError.includes("fecha") || mensajeError.includes("hora")) {
                    mensajeUsuario = `Error de fecha/hora: ${mensajeError}. Verifique que la fecha y hora sean correctas.`;
                }

                Swal.fire('Error', mensajeUsuario, 'error');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const cancelar = () => {
        navigate('/reserva');
    };

    if ((loading && id) || loadingData) {
        return (
            <div className="page-wrap">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="text-center py-5">
                                <div className="spinner-border text-rosa" role="status">
                                    <span className="visually-hidden">Cargando...</span>
                                </div>
                                <p className="mt-3 text-muted">
                                    {loadingData ? 'Cargando clientes y mesas...' : 'Cargando información de la reserva...'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrap">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card-custom">
                            <div className="card-header">
                                <div className="d-flex align-items-center">
                                    <Calendar size={24} className="me-2" />
                                    <h2 className="card-title mb-0">
                                        {id ? `Editar Reserva` : 'Nueva Reserva'}
                                    </h2>
                                </div>
                            </div>

                            <div className="card-body p-4">
                                <form onSubmit={guardarReserva}>
                                    <div className="row">
                                        {/* Cliente */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="idCliente" className="form-label">
                                                <User size={16} className="me-1" />
                                                Cliente *
                                            </label>
                                            <select
                                                className={`form-control ${errors.idCliente ? 'is-invalid' : ''}`}
                                                id="idCliente"
                                                value={idCliente}
                                                onChange={(e) => setIdCliente(e.target.value)}
                                                required
                                                disabled={diaBloqueado || esCliente}
                                            >
                                                <option value="">-- Selecciona un cliente --</option>
                                                {clientes.map((cliente) => (
                                                    <option key={cliente.id} value={cliente.id}>
                                                        {cliente.nombreCliente}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.idCliente && (
                                                <div className="invalid-feedback">{errors.idCliente}</div>
                                            )}
                                        </div>

                                        {/* Mesa */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="idMesa" className="form-label">
                                                <Table size={16} className="me-1" />
                                                Mesa *
                                            </label>
                                            <select
                                                className={`form-control ${errors.idMesa ? 'is-invalid' : ''}`}
                                                id="idMesa"
                                                value={idMesa}
                                                onChange={(e) => setIdMesa(e.target.value)}
                                                required
                                                disabled={diaBloqueado}
                                            >
                                                <option value="">-- Selecciona una mesa --</option>
                                                {mesas.map((mesa) => (
                                                    <option key={mesa.id} value={mesa.id}>
                                                        Mesa #{mesa.numero} - {mesa.ubicacion} ({mesa.capacidad} pers.)
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.idMesa && (
                                                <div className="invalid-feedback">{errors.idMesa}</div>
                                            )}
                                        </div>

                                        {/* Fecha */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="fecha" className="form-label">
                                                <Calendar size={16} className="me-1" />
                                                Fecha *
                                            </label>
                                            <input
                                                type="date"
                                                className={`form-control ${errors.fecha ? 'is-invalid' : ''} ${diaBloqueado ? 'bg-light' : ''}`}
                                                id="fecha"
                                                value={fecha}
                                                onChange={(e) => setFecha(e.target.value)}
                                                min={getFechaMinima()}
                                                required
                                                disabled={diaBloqueado}
                                            />
                                            {errors.fecha && (
                                                <div className="invalid-feedback">{errors.fecha}</div>
                                            )}
                                            <div className="form-text">
                                                {fecha ? formatearFechaLocal(fecha) : 'Selecciona una fecha'}
                                                {diaBloqueado && <span className="text-danger"> - {mensajeBloqueo}</span>}
                                            </div>
                                        </div>

                                        {/* Hora */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="hora" className="form-label">
                                                <Clock3 size={16} className="me-1" />
                                                Hora *
                                            </label>
                                            <select
                                                className={`form-control ${errors.hora ? 'is-invalid' : ''} ${diaBloqueado ? 'bg-light' : ''}`}
                                                id="hora"
                                                value={hora}
                                                onChange={(e) => setHora(e.target.value)}
                                                required
                                                disabled={diaBloqueado || horariosDisponibles.length === 0}
                                            >
                                                <option value="">-- Selecciona una hora --</option>
                                                {horariosDisponibles.map((horario) => (
                                                    <option key={horario} value={horario}>
                                                        {horario} hrs
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.hora && (
                                                <div className="invalid-feedback">{errors.hora}</div>
                                            )}
                                            <div className="form-text">
                                                {getMensajeHorarios()}
                                                {horariosDisponibles.length === 0 && !diaBloqueado &&
                                                    <span className="text-warning"> - No hay horarios disponibles para esta fecha</span>
                                                }
                                            </div>
                                        </div>

                                        

                                        {/* Información sobre estado en creación */}
                                        {!id && (
                                            <div className="col-12 mb-4">
                                                <div className="alert alert-warning">
                                                    <div className="d-flex align-items-center">
                                                        <AlertCircle size={16} className="me-2" />
                                                        <strong>Estado inicial:</strong> PENDIENTE
                                                    </div>
                                                    <small className="d-block mt-1">
                                                        Todas las reservas nuevas se crean como PENDIENTE.
                                                        Podrás confirmarla más tarde desde la lista de reservas.
                                                    </small>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ⬇️ ALERTA DE BLOQUEO */}
                                    {diaBloqueado && (
                                        <div className="alert alert-danger mb-4">
                                            <div className="d-flex align-items-center">
                                                <Ban size={16} className="me-2" />
                                                <strong>Reservas no disponibles</strong>
                                            </div>
                                            <div className="mt-2">
                                                {mensajeBloqueo}
                                            </div>
                                        </div>
                                    )}

                                    {/* Información del horario del restaurante */}
                                    {!diaBloqueado && (
                                        <div className="alert alert-primary mb-4">
                                            <div className="d-flex align-items-center">
                                                <Clock3 size={16} className="me-2" />
                                                <strong>Horario del Restaurante</strong>
                                            </div>
                                            <div className="mt-2">
                                                <strong>Horas disponibles:</strong> {configHorario.horaApertura} - {configHorario.horaCierre}<br />
                                                <strong>Intervalo de reservas:</strong> Cada {configHorario.intervaloMinutos} minutos<br />
                                                <strong>Horarios disponibles hoy:</strong> {horariosDisponibles.length} opciones
                                            </div>
                                        </div>
                                    )}

                                    {/* Información de la reserva */}
                                    {(idCliente && idMesa && fecha && hora && !diaBloqueado) && (
                                        <div className="alert alert-info">
                                            <h6 className="alert-heading">Resumen de la Reserva:</h6>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <strong>Cliente:</strong> {clientes.find(c => c.id === parseInt(idCliente))?.nombreCliente}
                                                </div>
                                                <div className="col-md-6">
                                                    <strong>Mesa:</strong> Mesa #{mesas.find(m => m.id === parseInt(idMesa))?.numero}
                                                </div>
                                                <div className="col-md-6">
                                                    <strong>Fecha:</strong> {formatearFechaLocal(fecha)}
                                                </div>
                                                <div className="col-md-6">
                                                    <strong>Hora:</strong> {hora} hrs
                                                </div>
                                                <div className="col-md-12 mt-2">
                                                    <strong>Estado:</strong>
                                                    <span className={`badge bg-${id ? (estado === 'PENDIENTE' ? 'warning' : estado === 'CONFIRMADA' ? 'success' : 'secondary') : 'warning'} ms-2`}>
                                                        {id ? estado : 'PENDIENTE'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botones de acción */}
                                    <div className="form-actions border-top pt-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-rosa"
                                            onClick={cancelar}
                                        >
                                            <ArrowLeft size={16} className="me-1" />
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-rosa ms-2"
                                            disabled={loading || diaBloqueado}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                                        <span className="visually-hidden">Guardando...</span>
                                                    </div>
                                                    Guardando...
                                                </>
                                            ) : diaBloqueado ? (
                                                <>
                                                    <Ban size={16} className="me-1" />
                                                    Reservas No Disponibles
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} className="me-1" />
                                                    {id ? 'Actualizar Reserva' : 'Crear Reserva'}
                                                </>
                                            )}
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

export default ReservaComponent;