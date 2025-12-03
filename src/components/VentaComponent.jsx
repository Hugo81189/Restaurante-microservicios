import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from 'sweetalert2';
import { listClientes } from "../services/ClienteService";
import { listProductos } from "../services/ProductoService";
import { listEmpleadosActivos } from "../services/EmpleadoService";
import { crearVenta, updateVenta, getVentaById, finalizarVenta, obtenerTicketPdf } from "../services/VentaService";
import { getReservasActivasByClienteId, getReservasHoyConfirmadasByClienteId } from "../services/ReservaService";
import { createAtiende, getAtiendeByVentaId, updateAtiende } from "../services/AtiendeService";
import { ShoppingCart, User, List, DollarSign, X, Calendar, RefreshCw, CheckCircle } from "lucide-react";
import AuthService from "../services/AuthService";

export const VentaComponent = () => {
    // --- ESTADOS PRINCIPALES ---
    const { id } = useParams();
    const [clienteId, setClienteId] = useState("");
    const [reservacionId, setReservacionId] = useState("");
    const [clientes, setClientes] = useState([]);
    const [empleadosActivos, setEmpleadosActivos] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [errors, setErrors] = useState({});
    const [detalles, setDetalles] = useState([]);
    const [productoSeleccionadoId, setProductoSeleccionadoId] = useState("");
    const [cantidad, setCantidad] = useState(1);
    const navegar = useNavigate();
    const [isSavedOrFinished, setIsSavedOrFinished] = useState(false);
    const isDirtyRef = useRef(false);
    const [ventaId, setVentaId] = useState(id ? parseInt(id, 10) : null);
    const [isFinalizada, setIsFinalizada] = useState(false);
    const [atiendeId, setAtiendeId] = useState(null);
    const [empleadoAsignado, setEmpleadoAsignado] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [empleadoSeleccionadoId, setEmpleadoSeleccionadoId] = useState("");
    const [loading, setLoading] = useState(false);
    const currentUser = AuthService.getCurrentUser();
    const roles = currentUser?.roles || [];
    const esMesero = roles.includes('ROLE_MESERO');
    const esCajeroOAdmin = roles.some(r => ['ROLE_CAJERO', 'ROLE_ADMINISTRADOR', 'ROLE_SUPERVISOR'].includes(r));
    const miUsername = currentUser?.sub;
    const [meseros, setMeseros] = useState([]);


    // -----------------------------------------------------------------
    // 💡 EFECTO: Carga de Clientes, Productos y Reservas - CORREGIDO
    // -----------------------------------------------------------------
    const finalizarVentaCompleta = async (idExplicito = null) => {
        // Usamos el ID que nos pasen O el del estado
        const idFinal = idExplicito || ventaId;

        console.log("🔄 Finalizando venta completamente...", { idFinal });

        if (!idFinal) {
            throw new Error("No hay ID de venta para finalizar");
        }

        try {
            // Usamos idFinal en lugar de ventaId
            const response = await finalizarVenta(idFinal);
            console.log("✅ Venta finalizada en backend:", response.data);

            setIsFinalizada(true);
            setIsSavedOrFinished(true);
            isDirtyRef.current = false;

            return response;
        } catch (error) {
            console.error("❌ Error al finalizar venta:", error);
            throw error;
        }
    };

    const imprimirTicket = async (idVenta) => {
        try {
            // 1. Petición segura con token
            const response = await obtenerTicketPdf(idVenta);

            // 2. Crear una URL temporal para el PDF
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);

            // 3. Abrir en nueva pestaña
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Error al descargar ticket:", error);
            Swal.fire('Error', 'No se pudo generar el ticket.', 'error');
        }
    };


    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            try {
                const [clientesRes, productosRes, empleadosRes] = await Promise.all([
                    listClientes(),
                    listProductos(),
                    listEmpleadosActivos()
                ]);

                setClientes(clientesRes.data || []);
                setProductos(productosRes.data || []);

                const listaEmpleados = empleadosRes.data || [];
                setEmpleadosActivos(listaEmpleados);

                const listaMeseros = listaEmpleados.filter(emp =>
                    emp.puesto?.toLowerCase() === 'mesero' ||
                    emp.roles?.includes('ROLE_MESERO')
                );
                setMeseros(listaMeseros);

                // --- LÓGICA DE ASIGNACIÓN AUTOMÁTICA ---
                if (esMesero) {
                    // 🔒 Si soy mesero, me asigno automáticamente y bloqueo
                    const miPerfil = listaEmpleados.find(e => e.username === miUsername);

                    if (miPerfil) {
                        setEmpleadoAsignado(miPerfil);
                        setEmpleadoSeleccionadoId(miPerfil.id);
                        console.log("✅ Mesero auto-asignado:", miPerfil);
                    } else {
                        Swal.fire('Error', 'Tu usuario mesero no tiene perfil de empleado vinculado.', 'error');
                    }
                } else if (esCajeroOAdmin) {
                    // 📋 Si soy cajero/admin, NO pre-selecciono nada (o puedes pre-seleccionar el primero)
                    console.log("ℹ️ Usuario con permisos de selección. Meseros disponibles:", listaMeseros.length);

                    // Opcional: Pre-seleccionar el primer mesero
                    if (listaMeseros.length > 0) {
                        setEmpleadoSeleccionadoId(listaMeseros[0].id);
                        setEmpleadoAsignado(listaMeseros[0]);
                    }
                }

                // 2. Si es edición, cargar la venta existente
                if (id) {
                    console.log("🔄 Cargando venta para edición, ID:", id);
                    const ventaRes = await getVentaById(id);
                    const ventaData = ventaRes.data;

                    const isFin = ventaData.statusOrden === 'FINALIZADO';
                    setClienteId(ventaData.clienteId?.toString() || "");
                    setReservacionId(ventaData.reservacionId?.toString() || "");
                    setIsFinalizada(isFin);
                    setVentaId(parseInt(id, 10));

                    // ⬅️ CORREGIDO: Enriquecer detalles CON productos ya cargados
                    const detallesEnriquecidos = ventaData.detalles?.map(detalle => {
                        const productoInfo = productosRes.data.find(p => p.idProducto === detalle.productoId);
                        console.log(`🔍 Detalle ${detalle.productoId}:`, {
                            detalle,
                            productoEncontrado: productoInfo
                        });
                        return {
                            ...detalle,
                            nombreProducto: productoInfo?.nombre || 'Producto no encontrado',
                            precioUnitario: productoInfo?.precio || detalle.precioUnitario || 0
                        };
                    }) || [];

                    console.log("📊 Detalles enriquecidos:", detallesEnriquecidos);
                    setDetalles(detallesEnriquecidos);

                    // Cargar reservas del cliente
                    if (ventaData.clienteId) {
                        cargarReservasDelCliente(ventaData.clienteId);
                    }

                    // Cargar relación Atiende existente
                    try {
                        const atiendeRes = await getAtiendeByVentaId(parseInt(id, 10));
                        const atiendeData = Array.isArray(atiendeRes.data) ? atiendeRes.data[0] : atiendeRes.data;
                        if (atiendeData && atiendeData.id) {
                            setAtiendeId(atiendeData.id);

                            // --- 🛠️ CORRECCIÓN AQUÍ: Actualizar los estados visuales ---
                            const empId = atiendeData.idEmpleado;
                            setEmpleadoSeleccionadoId(empId); // 1. Actualizar el valor del Select

                            // 2. Buscar el objeto empleado completo para mostrar la tarjeta visual
                            // (Nota: 'empleadosActivos' podría no estar listo aquí por ser asíncrono, 
                            //  así que buscamos en 'empleadosRes' que cargaste arriba en Promise.all)
                            const empleadoEncontrado = empleadosRes.data.find(e => e.id === empId);
                            if (empleadoEncontrado) {
                                setEmpleadoAsignado(empleadoEncontrado);
                            }

                            console.log("✅ Relación Atiende cargada y asignada:", atiendeData);
                        }
                    } catch (atiendeError) {
                        console.warn("⚠️ No se pudo cargar relación Atiende:", atiendeError);
                    }
                }

                isDirtyRef.current = false;

            } catch (error) {
                console.error("❌ Error cargando datos:", error);
                setErrors(prev => ({ ...prev, api: "Error al cargar los datos." }));
                Swal.fire('Error', 'No se pudieron cargar los datos necesarios.', 'error');
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [id, navegar]);



    // -----------------------------------------------------------------
    // 💡 FUNCIÓN PARA CREAR/ACTUALIZAR RELACIÓN ATIENDE
    // -----------------------------------------------------------------
    const gestionarRelacionAtiende = async (ventaId) => {
        if (!empleadoSeleccionadoId) {
            console.warn("⚠️ No se ha seleccionado empleado para 'Atiende'");
            return { id: null };
        }

        const atiendeDto = {
            idEmpleado: empleadoSeleccionadoId, // Usamos el estado del select
            idVenta: ventaId
        };

        console.log("🔄 Gestionando relación Atiende:", atiendeDto);

        try {
            let response;
            if (atiendeId) {
                response = await updateAtiende(atiendeId, atiendeDto);
                console.log("✅ Relación Atiende actualizada:", response.data);
            } else {
                response = await createAtiende(atiendeDto);
                setAtiendeId(response.data.id);
                console.log("✅ Relación Atiende creada:", response.data);
            }
            return response.data;
        } catch (error) {
            console.error("❌ Error en relación Atiende:", error);
            // No rechazar la promesa, solo retornar un objeto vacío
            return { id: null };
        }
    };

    // -----------------------------------------------------------------
    // 💡 FUNCIÓN PARA CARGAR RESERVAS DEL CLIENTE
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // 💡 FUNCIÓN PARA CARGAR RESERVAS DEL CLIENTE - SOLO HOY Y CONFIRMADAS
    // -----------------------------------------------------------------
    const cargarReservasDelCliente = (clienteId) => {
        if (!clienteId) {
            setReservas([]);
            return;
        }

        console.log(`🔄 Cargando reservas confirmadas para hoy del cliente: ${clienteId}`);

        getReservasHoyConfirmadasByClienteId(clienteId)
            .then(res => {
                const reservasFiltradas = res.data || [];
                setReservas(reservasFiltradas);

                console.log(`📅 Reservas confirmadas para hoy - Cliente ${clienteId}:`, {
                    cantidad: reservasFiltradas.length,
                    reservas: reservasFiltradas.map(r => ({
                        id: r.id,
                        fecha: r.fecha,
                        hora: r.hora,
                        mesa: r.idMesa,
                        estado: r.estado
                    }))
                });

                // Si no hay reservas para hoy, mostrar en consola
                if (reservasFiltradas.length === 0) {
                    console.log(`ℹ️  El cliente ${clienteId} no tiene reservas confirmadas para hoy`);
                }
            })
            .catch(error => {
                console.error("❌ Error al cargar reservas confirmadas para hoy:", error);
                // En caso de error, mostrar array vacío
                setReservas([]);
            });
    };

    // -----------------------------------------------------------------
    // 💡 MANEJADOR DE CAMBIO DE CLIENTE
    // -----------------------------------------------------------------
    const handleClienteChange = (e) => {
        const nuevoClienteId = e.target.value;
        setClienteId(nuevoClienteId);
        setReservacionId("");

        if (nuevoClienteId) {
            cargarReservasDelCliente(parseInt(nuevoClienteId));
        } else {
            setReservas([]);
        }
    };

    // -----------------------------------------------------------------
    // 💡 FUNCIÓN DE GUARDADO - SIMPLIFICADA
    // -----------------------------------------------------------------
    const persistirVenta = (finalizar = false) => {
        if (esCajeroOAdmin && !empleadoSeleccionadoId) {
            Swal.fire('Advertencia', 'Debe seleccionar un mesero para la venta.', 'warning');
            return Promise.reject("Mesero no seleccionado");
        }

        if (!clienteId) {
            Swal.fire('Advertencia', 'Debe seleccionar un cliente para guardar.', 'warning');
            return Promise.reject("Cliente no seleccionado");
        }

        if (detalles.length === 0) {
            Swal.fire('Advertencia', 'Debe agregar al menos un producto para guardar.', 'warning');
            return Promise.reject("No hay productos");
        }

        const detallesParaAPI = detalles.map(d => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            id: d.id || null,
            statusDetalle: finalizar ? "FINALIZADO" : "PENDIENTE"
        }));

        // 🔥 CORRECCIÓN: Lógica mejorada para usuarioAsignado
        let usuarioAsignado = null;
        let debugInfo = {};

        if (esCajeroOAdmin) {
            // Para Cajero/Admin: usar el mesero seleccionado
            const empObj = empleadosActivos.find(e => e.id === empleadoSeleccionadoId);
            debugInfo.empleadoEncontrado = empObj;
            console.log("Empleado encontrado para asignar:", empObj);

            if (empObj) {
                // 🔍 BUSCAR USERNAME EN DIFERENTES PROPIEDADES POSIBLES
                usuarioAsignado = empObj.username || empObj.usuario || empObj.userName || empObj.nombreUsuario;
                debugInfo.usernameEncontrado = usuarioAsignado;
                debugInfo.propiedadesEmpleado = Object.keys(empObj);

                if (!usuarioAsignado) {
                    console.error("❌ No se pudo encontrar username en:", empObj);
                    Swal.fire('Error', `El mesero seleccionado no tiene username configurado. Propiedades: ${Object.keys(empObj).join(', ')}`, 'error');
                    return Promise.reject("Username de mesero no disponible");
                }
            } else {
                Swal.fire('Error', 'No se pudo encontrar el mesero seleccionado.', 'error');
                return Promise.reject("Mesero no encontrado");
            }
        } else if (esMesero) {
            // Para Mesero: auto-asignarse
            usuarioAsignado = miUsername;
            debugInfo.meseroAutoAsignado = usuarioAsignado;
        }


        const ventaDto = {
            id: ventaId,
            clienteId: parseInt(clienteId, 10),
            reservacionId: reservacionId ? parseInt(reservacionId, 10) : null,
            detalles: detallesParaAPI,
            statusOrden: finalizar ? "FINALIZADO" : "PENDIENTE",
            usuarioAsignado: usuarioAsignado // 🔥 Ahora siempre tendrá un valor válido
        };

        const apiCall = ventaId ? updateVenta(ventaId, ventaDto) : crearVenta(ventaDto);


        return apiCall
            .then((response) => {
                const nuevaVentaId = response.data.id;
                setVentaId(nuevaVentaId);

                // GESTIONAR RELACIÓN ATIENDE
                return gestionarRelacionAtiende(nuevaVentaId)
                    .then(() => response)
                    .catch(atiendeError => {
                        console.warn("⚠️ Error en relación Atiende:", atiendeError);
                        return response;
                    });
            })
            .then((response) => {
                // SINCRONIZAR DETALLES
                const detallesConInfo = response.data.detalles.map(detalleBackend => {
                    const productoInfo = productos.find(p => p.idProducto === detalleBackend.productoId);
                    return {
                        ...detalleBackend,
                        nombreProducto: productoInfo?.nombre || 'Producto no encontrado',
                        precioUnitario: productoInfo?.precio || 0
                    };
                });

                setDetalles(detallesConInfo);
                isDirtyRef.current = false;
                setIsSavedOrFinished(true);

                if (finalizar) {
                    setIsFinalizada(true);
                }

                Swal.fire('Éxito', finalizar ? 'Venta finalizada correctamente.' : 'Venta guardada como borrador.', 'success');
                return response;
            })
            .catch(error => {
                console.error("❌ Error al guardar venta:", error);
                const apiMessage = error.response?.data || "Error de red al guardar la orden.";
                Swal.fire({
                    title: 'Error de Persistencia',
                    text: apiMessage,
                    icon: 'error',
                    confirmButtonColor: '#3E6770'
                });
                return Promise.reject(error);
            });
    };

    // --- Handlers de Formulario y Botones ---

    // 💡 FUNCIÓN DE CONFIRMACIÓN DE SALIDA
    const handleCancelAndExit = (targetRoute = '/venta') => {
        if (isDirtyRef.current && !isSavedOrFinished) {
            Swal.fire({
                title: "¿Deseas guardar los cambios?",
                text: "Tienes cambios sin guardar. ¿Quieres guardarlos antes de salir?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: '#3E6770',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, guardar',
                cancelButtonText: 'No, descartar',
                showDenyButton: true,
                denyButtonText: 'Cancelar',
                denyButtonColor: '#dc3545'
            }).then((result) => {
                if (result.isConfirmed) {
                    persistirVenta(false).then(() => {
                        Swal.fire('Guardado!', 'La orden se guardó como borrador.', 'success');
                        navegar(targetRoute);
                    }).catch(() => {
                        // Se queda si falla
                    });
                } else if (result.isDenied) {
                    navegar(targetRoute);
                }
            });
        } else {
            navegar(targetRoute);
        }
    };

    // 💡 FUNCIÓN DE FINALIZAR COMPRA - SIMPLIFICADA
    // 💡 FUNCIÓN DE FINALIZAR COMPRA - CORREGIDA
    const handleFinalizarCompra = () => {
        if (detalles.length === 0) {
            Swal.fire('Advertencia', 'Agregue productos antes de finalizar.', 'warning');
            return;
        }

        if (!clienteId) {
            Swal.fire('Advertencia', 'Seleccione un cliente antes de finalizar.', 'warning');
            return;
        }

        Swal.fire({
            title: "¿Confirmar Compra Final?",
            html: `
                <div class="text-start">
                    <p>El total es <strong>${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calcularTotal())}</strong>.</p>
                    <p>Una vez finalizada, esta orden no podrá ser editada.</p>
                    <div class="alert alert-warning mt-2">
                        <small>
                            <strong>Cliente:</strong> ${clientes.find(c => c.id.toString() === clienteId)?.nombreCliente || 'N/A'}<br/>
                            <strong>Productos:</strong> ${detalles.length} producto(s)<br/>
                            <strong>Empleado:</strong> ${empleadoAsignado?.nombre || 'No asignado'}
                        </small>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'SÍ, FINALIZAR COMPRA',
            cancelButtonText: 'Revisar',
            confirmButtonColor: '#4D858D',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed) {
                console.log("🔄 Iniciando proceso de finalización...", {
                    ventaId,
                    clienteId,
                    detallesCount: detalles.length
                });

                // Mostrar loading
                Swal.fire({
                    title: 'Finalizando venta...',
                    text: 'Por favor espere',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // ✅ FLUJO CORREGIDO: Primero guardar como PENDIENTE, luego FINALIZAR
                const procesoFinalizacion = async () => {
                    try {
                        // 1. Si no hay ventaId, crear la venta primero como PENDIENTE
                        if (!ventaId) {
                            console.log("📝 Creando venta primero...");
                            await persistirVenta(false); // Guardar como borrador primero
                        }

                        // 2. Ahora finalizar la venta usando el endpoint específico
                        const response = await finalizarVentaCompleta();

                        console.log("✅ Venta finalizada exitosamente:", response.data);

                        // 3. Cerrar loading y mostrar éxito
                        Swal.fire({
                            title: '¡Compra Exitosa!',
                            html: `
                                <div class="text-center">
                                    <div class="mb-3">
                                        <CheckCircle size={48} className="text-success" />
                                    </div>
                                    <p>La orden <strong>#${response.data.id}</strong> ha sido finalizada correctamente.</p>
                                    <p class="text-muted">Total: <strong>${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calcularTotal())}</strong></p>
                                    <p class="text-success"><small>Estado: FINALIZADO</small></p>
                                </div>
                            `,
                            icon: 'success',
                            confirmButtonColor: '#4D858D',
                            confirmButtonText: 'Ver Lista de Ventas'
                        }).then(() => {
                            // Navegar solo después de confirmar el éxito
                            navegar('/venta');
                        });

                    } catch (error) {
                        console.error("❌ Error en el proceso de finalización:", error);

                        // Cerrar loading y mostrar error
                        Swal.fire({
                            title: 'Error al Finalizar',
                            text: error.response?.data?.message || error.response?.data || 'Error al finalizar la venta. Por favor intente nuevamente.',
                            icon: 'error',
                            confirmButtonColor: '#dc3545'
                        });
                    }
                };

                procesoFinalizacion();
            }
        });
    };
    // -----------------------------------------------------------------
    // 💡 LÓGICA DEL CARRITO - SIMPLIFICADA
    // -----------------------------------------------------------------
    // src/components/VentaComponent.jsx

    const agregarProducto = (e) => {
        e.preventDefault();
        if (!productoSeleccionadoId || cantidad <= 0 || !clienteId) {
            Swal.fire('Advertencia', 'Debe seleccionar un cliente, producto y cantidad válida.', 'warning');
            return;
        }

        // 💡 Paso 1: Usar el producto actual para obtener su precio
        const productoElegido = productos.find(p => p.idProducto.toString() === productoSeleccionadoId);
        if (!productoElegido) return;

        // 💡 Paso 2: Crear el DTO MÍNIMO que el backend necesita para añadir un solo ítem.
        const detalleParaEnvio = {
            productoId: productoElegido.idProducto,
            cantidad: cantidad,
        };

        // 🔥 CORRECCIÓN CRÍTICA: Incluir usuarioAsignado en el DTO
        let usuarioAsignado = null;

        if (esCajeroOAdmin) {
            // Para Cajero/Admin: usar el mesero seleccionado
            const empObj = empleadosActivos.find(e => e.id === empleadoSeleccionadoId);
            if (empObj) {
                usuarioAsignado = empObj.username || empObj.usuario || empObj.userName;
            }
        } else if (esMesero) {
            // Para Mesero: auto-asignarse
            usuarioAsignado = miUsername;
        }

        console.log("🔍 DEBUG AGREGAR PRODUCTO - usuarioAsignado:", {
            usuarioAsignado,
            empleadoSeleccionadoId,
            empObj: empleadosActivos.find(e => e.id === empleadoSeleccionadoId)
        });

        // El backend se encargará de fusionar/incrementar la cantidad si ya existe.
        const ventaDto = {
            id: ventaId,
            clienteId: parseInt(clienteId, 10),
            detalles: [detalleParaEnvio], // Enviamos solo el detalle que queremos agregar/modificar
            usuarioAsignado: usuarioAsignado // 🔥 ¡ESTA LÍNEA FALTABA!
        };

        console.log("📤 DTO ENVIADO EN AGREGAR PRODUCTO:", ventaDto);

        // 💡 Paso 3: Decidir si crear o actualizar
        const apiCall = ventaId
            ? updateVenta(ventaId, ventaDto)
            : crearVenta(ventaDto);

        apiCall.then(response => {
            const detallesEnriquecidos = response.data.detalles.map(detalle => {
                const productoInfo = productos.find(p => p.idProducto === detalle.productoId);
                return {
                    ...detalle,
                    nombreProducto: productoInfo?.nombre || 'Producto no encontrado',
                    precioUnitario: productoInfo?.precio || detalle.precioUnitario || 0
                };
            });
            setDetalles(detallesEnriquecidos);
            setVentaId(response.data.id); // Asegura que el ID se guarde si es nuevo

            isDirtyRef.current = true; // El carrito ha sido modificado y guardado
            Swal.fire('Producto Añadido', `Venta #${response.data.id} actualizada como borrador.`, 'success');

            // 💡 Gestionar Atiende solo si es la primera creación
            if (!ventaId) {
                gestionarRelacionAtiende(response.data.id);
            }

        }).catch(error => {
            console.error("Error al guardar:", error);
            Swal.fire('Error', error.response?.data || 'No se pudo añadir el producto al borrador.', 'error');
        });

        // Limpiar selección y cantidad
        setProductoSeleccionadoId("");
        setCantidad(1);
    };
    // ...

    const eliminarDetalle = (productoId) => {
        setDetalles(prevDetalles => prevDetalles.filter(d => d.productoId !== productoId));
    };

    const calcularTotal = () => {
        return detalles.reduce((total, d) => total + (d.precioUnitario * d.cantidad), 0);
    };

    // -----------------------------------------------------------------
    // 💡 RENDERIZADO
    // -----------------------------------------------------------------

    if (cargando) {
        return (
            <div className="page-wrap">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <div className="card-custom">
                                <div className="card-body text-center py-5">
                                    <div className="spinner-border text-rosa" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                    <p className="mt-3 text-muted">
                                        {id ? "Cargando venta para edición..." : "Cargando datos..."}
                                    </p>
                                </div>
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
                    <div className="col-lg-10">
                        <div className="card-custom">
                            <div className="card-header">
                                <h5 className="card-title text-secondary mb-3">
                                    <User size={20} className="me-2" />
                                    Atendido por:
                                </h5>

                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        {esMesero ? (
                                            // 🔒 VISTA PARA MESEROS: Campo bloqueado
                                            <div className="alert alert-info mb-0">
                                                <div className="d-flex align-items-center">
                                                    <User size={18} className="me-2" />
                                                    <div>
                                                        <strong>Venta asignada a ti</strong>
                                                        <p className="mb-0 small text-muted">
                                                            Como mesero, las ventas se asignan automáticamente a tu perfil
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // 📋 VISTA PARA CAJERO/ADMIN: Desplegable de meseros
                                            <>
                                                <label htmlFor="meseroSelect" className="form-label">
                                                    Seleccionar Mesero *
                                                </label>
                                                <select
                                                    id="meseroSelect"
                                                    className="form-control"
                                                    value={empleadoSeleccionadoId}
                                                    onChange={(e) => {
                                                        const id = parseInt(e.target.value);
                                                        setEmpleadoSeleccionadoId(id);
                                                        const emp = meseros.find(m => m.id === id);
                                                        setEmpleadoAsignado(emp);
                                                    }}
                                                    disabled={isFinalizada}
                                                >
                                                    <option value="">-- Seleccionar Mesero --</option>
                                                    {meseros.map(mesero => (
                                                        <option key={mesero.id} value={mesero.id}>
                                                            {mesero.nombre} - {mesero.puesto}
                                                        </option>
                                                    ))}
                                                </select>
                                                {meseros.length === 0 && (
                                                    <small className="text-danger">
                                                        ⚠️ No hay meseros activos disponibles
                                                    </small>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Tarjeta visual del empleado asignado */}
                                    {empleadoAsignado && (
                                        <div className="col-md-4">
                                            <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                                                <div className="empleado-avatar bg-primary text-white rounded-circle p-2">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <div className="fw-bold small">{empleadoAsignado.nombre}</div>
                                                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                                        {empleadoAsignado.puesto}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card-body p-4">
                                <form onSubmit={(e) => { e.preventDefault(); persistirVenta(false); }} noValidate>

                                    {/* SECCIÓN 1: SELECCIÓN DE CLIENTE Y RESERVA */}
                                    <div className="row mb-4 border-bottom pb-3">
                                        <div className="col-12">
                                            <h4 className="text-secondary mb-3">
                                                <User size={20} className="me-2" />
                                                Información del Cliente
                                            </h4>
                                        </div>

                                        {/* Selección de Cliente */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="clienteId" className="form-label d-flex align-items-center">
                                                Cliente Activo *
                                                <span className="ms-2 badge bg-info bg-opacity-10 text-info fs-xxsmall">
                                                    Requerido
                                                </span>
                                            </label>
                                            <select
                                                id="clienteId"
                                                className="form-control"
                                                value={clienteId}
                                                onChange={handleClienteChange}
                                                required
                                                disabled={isFinalizada}
                                            >
                                                <option value="">-- Selecciona un Cliente --</option>
                                                {clientes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.nombreCliente}</option>
                                                ))}
                                            </select>
                                            {errors.clientes && <div className="invalid-feedback d-block">{errors.clientes}</div>}
                                        </div>

                                        {/* Selección de Reserva (Opcional) */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="reservacionId" className="form-label d-flex align-items-center">
                                                <Calendar size={16} className="me-1" />
                                                Asociar a Reserva de Hoy (Opcional)
                                            </label>
                                            <select
                                                id="reservacionId"
                                                className="form-control"
                                                value={reservacionId}
                                                onChange={(e) => setReservacionId(e.target.value)}
                                                disabled={!clienteId || reservas.length === 0 || isFinalizada}
                                            >
                                                <option value="">-- Sin reserva --</option>
                                                {reservas.map(reserva => (
                                                    <option key={reserva.id} value={reserva.id}>
                                                        Reserva #{reserva.id} - {reserva.hora.substring(0, 5)} - Mesa {reserva.idMesa}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="form-text">
                                                {!clienteId
                                                    ? "Selecciona un cliente primero para ver sus reservas confirmadas de hoy"
                                                    : reservas.length === 0
                                                        ? `El cliente no tiene reservas confirmadas para hoy (${new Date().toLocaleDateString()})`
                                                        : `${reservas.length} reserva(s) confirmada(s) para hoy`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mostrar información de la reserva seleccionada */}
                                    {reservacionId && (
                                        <div className="alert alert-success mb-4">
                                            <div className="d-flex align-items-center">
                                                <Calendar size={16} className="me-2" />
                                                <strong>Reserva de hoy confirmada asociada:</strong>
                                            </div>
                                            <div className="mt-2">
                                                {(() => {
                                                    const reservaSeleccionada = reservas.find(r => r.id.toString() === reservacionId);
                                                    return reservaSeleccionada ? (
                                                        <div className="row">
                                                            <div className="col-md-3">
                                                                <strong>Hora:</strong> {reservaSeleccionada.hora.substring(0, 5)}
                                                            </div>
                                                            <div className="col-md-3">
                                                                <strong>Mesa:</strong> {reservaSeleccionada.idMesa}
                                                            </div>
                                                            <div className="col-md-3">
                                                                <strong>Estado:</strong>
                                                                <span className="badge bg-success ms-1">Confirmada</span>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <strong>Fecha:</strong> Hoy
                                                            </div>
                                                        </div>
                                                    ) : "Información no disponible";
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Resto del código permanece igual... */}
                                    {/* SECCIÓN 2: AGREGAR PRODUCTOS */}
                                    <div className="row mb-4 border-bottom pb-3">
                                        <div className="col-12">
                                            <h4 className="text-secondary mb-3">
                                                <List size={20} className="me-2" />
                                                Agregar al Pedido
                                            </h4>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="productoSelect" className="form-label">Producto</label>
                                            <select
                                                id="productoSelect"
                                                className="form-control"
                                                value={productoSeleccionadoId}
                                                onChange={(e) => setProductoSeleccionadoId(e.target.value)}
                                                disabled={isFinalizada}
                                            >
                                                <option value="">-- Selecciona un Producto --</option>
                                                {productos.map(p => (
                                                    <option key={p.idProducto} value={p.idProducto}>
                                                        {p.nombre} ({new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(p.precio)})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.productos && <div className="invalid-feedback d-block">{errors.productos}</div>}
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <label htmlFor="cantidadInput" className="form-label">Cantidad</label>
                                            <input
                                                id="cantidadInput"
                                                type="number"
                                                min="1"
                                                className="form-control"
                                                value={cantidad}
                                                onChange={(e) => {
                                                    const value = e.target.value === "" ? "" : parseInt(e.target.value);
                                                    // Permitir campo vacío temporalmente
                                                    if (value === "" || (!isNaN(value) && value >= 1)) {
                                                        setCantidad(value === "" ? "" : value);
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    // Solo validar cuando el campo pierde el foco
                                                    if (e.target.value === "" || parseInt(e.target.value) < 1) {
                                                        setCantidad(1);
                                                        Swal.fire({
                                                            title: 'Valor ajustado',
                                                            text: 'La cantidad se estableció en 1',
                                                            icon: 'info',
                                                            timer: 1500,
                                                            showConfirmButton: false
                                                        });
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    // Prevenir teclas negativas pero permitir borrar
                                                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                disabled={isFinalizada}
                                            />

                                        </div>
                                        <div className="col-md-3 d-flex align-items-end mb-3">
                                            <button
                                                type="button"
                                                className="btn btn-primary w-100 btn-rosa"
                                                onClick={agregarProducto}
                                                disabled={isFinalizada || !clienteId}
                                            >
                                                Añadir
                                            </button>
                                        </div>
                                    </div>

                                    {/* SECCIÓN 3: RESUMEN DEL CARRITO */}
                                    <div className="row">
                                        <div className="col-12 mb-3">
                                            <h4 className="text-secondary"><DollarSign size={20} className="me-2" /> Resumen del Pedido</h4>
                                        </div>
                                        <div className="col-12">
                                            <table className="table tabla-custom">
                                                <thead>
                                                    <tr>
                                                        <th>Producto</th>
                                                        <th className="text-center">Cant.</th>
                                                        <th className="text-end">Precio U.</th>
                                                        <th className="text-end">Subtotal</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detalles.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" className="text-center text-muted">Aún no hay productos en la venta.</td>
                                                        </tr>
                                                    ) : (
                                                        detalles.map(d => (
                                                            <tr key={d.productoId}>
                                                                <td>{d.nombreProducto}</td>
                                                                <td className="text-center">{d.cantidad}</td>
                                                                <td className="text-end">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(d.precioUnitario)}</td>
                                                                <td className="text-end fw-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(d.precioUnitario * d.cantidad)}</td>
                                                                <td>
                                                                    {!isFinalizada && (
                                                                        <button type="button" className="btn-icon btn-delete" onClick={() => eliminarDetalle(d.productoId)}>
                                                                            <X size={16} />
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="fw-bold bg-light">
                                                        <td colSpan="3" className="text-end">TOTAL:</td>
                                                        <td className="text-end">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calcularTotal())}</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    {/* SECCIÓN 4: BOTONES DE ACCIÓN */}
                                    <div className="form-actions border-top pt-3 mt-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-rosa"
                                            onClick={() => handleCancelAndExit('/venta')}
                                        >
                                            {isFinalizada ? "Regresar a Lista" : "Cancelar y Salir"}
                                        </button>

                                        {!isFinalizada && (
                                            // Botón Finalizar Compra
                                            <button
                                                type="button" // Importante: type="button" para que no envíe el formulario por defecto
                                                className="btn btn-success w-100 mb-2" // Dale un estilo verde para destacar
                                                onClick={handleFinalizarCompra} // 👈 ¡AQUÍ ESTÁ LA CONEXIÓN QUE FALTABA!
                                                disabled={loading || detalles.length === 0}
                                            >
                                                FINALIZAR COMPRA ({new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calcularTotal())})
                                            </button>
                                        )}

                                        {/* Botón Guardar Borrador (Solo si estamos editando y no está finalizado) */}
                                        {ventaId && !isFinalizada && (
                                            <button
                                                type="submit"
                                                className="btn btn-outline-rosa ms-2"
                                            >
                                                Guardar Borrador
                                            </button>
                                        )}

                                        {/* 💡 ENLACE DEL TICKET (Solo si la venta existe y está FINALIZADA) */}
                                        {ventaId && isFinalizada && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-info ms-2"
                                                onClick={() => imprimirTicket(ventaId)}
                                            >
                                                Imprimir Ticket
                                            </button>
                                        )}
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

export default VentaComponent;