// src/components/ProductoComponent.jsx

import React, { useState, useEffect } from "react";
import { crearProducto, getProducto, updateProducto } from "../services/ProductoService";
import { listTipos } from "../services/TipoService";
import { useNavigate, useParams } from "react-router-dom"; 
import { Camera, Package, FileText, DollarSign, Tag, X } from "lucide-react";
import Swal from 'sweetalert2';

export const ProductoComponent = () => {
    const { id } = useParams();

    // --- ESTADOS PRINCIPALES ---
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [precio, setPrecio] = useState("");
    const [idTipo, setIdTipo] = useState("");
    
    // 💡 ESTADOS DEL ARCHIVO/IMAGEN
    const [imagenFile, setImagenFile] = useState(null); // Archivo cargado
    const [urlImagenActual, setUrlImagenActual] = useState(''); // URL que ya existe en DB

    // --- ESTADOS DE CARGA Y ERRORES ---
    const [tipos, setTipos] = useState([]);
    const [loadingTipos, setLoadingTipos] = useState(true);
    const [errorTipos, setErrorTipos] = useState(null);
    const [errors, setErrors] = useState({});

    const navegar = useNavigate();

    // -----------------------------------------------------------------
    // 💡 LÓGICA DE CARGA (Mode Edición)
    // -----------------------------------------------------------------

    useEffect(() => {
        // Carga los Tipos
        listTipos()
            .then((response) => {
                const tiposNormalizados = response.data.map(tipo => ({
                    id: tipo.id,
                    nombre: tipo.tipo || tipo.nombre
                }));
                setTipos(tiposNormalizados);
                setLoadingTipos(false);
            })
            .catch((error) => {
                console.error("Error al cargar los tipos:", error);
                setErrorTipos("No se pudieron cargar los tipos de producto.");
                setLoadingTipos(false);
            });

        // Carga el Producto a Editar (si existe ID)
        if (id) {
            getProducto(id).then((res) => {
                setNombre(res.data.nombre || "");
                setDescripcion(res.data.descripcion || "");
                setPrecio(res.data.precio ? res.data.precio.toString() : ""); 
                setIdTipo(res.data.idTipo ? res.data.idTipo.toString() : ""); 
                setUrlImagenActual(res.data.urlImagen || '') // 💡 Cargar URL actual
            }).catch((error) => {
                console.error("Error al cargar el producto:", error);
                setErrors({ api: "No se pudo cargar la información del producto para edición." });
            });
        }

    }, [id]); 

    // --- Handlers de Actualización ---
    const actualizaNombre = (e) => { setNombre(e.target.value); }
    const actualizaDescripcion = (e) => { setDescripcion(e.target.value); }
    const actualizaPrecio = (e) => { setPrecio(e.target.value); }
    const actualizaIdTipo = (e) => { setIdTipo(e.target.value); }

    // 💡 HANDLER DE ARCHIVO
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImagenFile(e.target.files[0]);
        } else {
            setImagenFile(null);
        }
    }

    function pageTitulo() {
        return id ? "Actualizar Producto" : "Registrar Producto";
    }

    function validarFormulario() {
        const newErrors = {};
        let isValid = true;
        // ... (Tu lógica de validación) ...
        if (!nombre.trim()) { newErrors.nombre = "El nombre es obligatorio."; isValid = false; }
        if (!descripcion.trim()) { newErrors.descripcion = "La descripción es obligatoria."; isValid = false; }
        if (!precio || parseFloat(precio) <= 0) { newErrors.precio = "El precio debe ser positivo."; isValid = false; }
        if (!idTipo) { newErrors.idTipo = "Debe seleccionar un tipo."; isValid = false; }
        
        // Si es nuevo y no se sube imagen
        if (!id && !imagenFile) { 
            newErrors.file = "Debe seleccionar una imagen para el nuevo producto.";
            isValid = false;
        }
        
        setErrors(newErrors);
        return isValid;
    }

    // 💡 FUNCIÓN DE GUARDADO MODIFICADA PARA ENVIAR MULTIPART/FORM-DATA
    function saveProducto(e) {
        e.preventDefault();
        if (!validarFormulario()) {
            Swal.fire({
                title: 'Error de Validación',
                text: 'Por favor, completa todos los campos obligatorios correctamente.',
                icon: 'error',
                confirmButtonColor: '#3E6770'
            });
            return;
        }

        const formData = new FormData();
        const isUpdate = !!id;
        
        // 1. Añadir el archivo, si existe
        if (imagenFile) {
            formData.append('file', imagenFile);
        } else if (isUpdate) {
            // Si es edición y NO subimos un archivo, enviamos un Blob vacío para evitar errores
            // y confiamos en que el backend use urlImagenActual.
            formData.append('file', new Blob([""], { type: 'text/plain' }));
        }

        // 2. Construir y Añadir el DTO (serializado como JSON)
        const productoDtoJson = JSON.stringify({
            nombre,
            descripcion,
            precio: parseFloat(precio),
            idTipo: parseInt(idTipo, 10),
            // Incluir la URL actual para que el backend la conserve si no se sube un nuevo archivo
            urlImagen: isUpdate ? urlImagenActual : null 
        });
        
        // CRÍTICO: Adjuntar el JSON bajo la clave 'producto' que espera el @RequestPart
        formData.append('producto', new Blob([productoDtoJson], { type: 'application/json' }));

        // 3. Llamada a la API
        const promise = isUpdate ? updateProducto(id, formData) : crearProducto(formData);

        promise.then(() => {
            const successMsg = isUpdate ? 'actualizado' : 'guardado';
            Swal.fire('¡Éxito!', `Producto ${successMsg} con éxito.`, 'success');
            navegar('/producto');
        }).catch((error) => {
            console.error(`Error al ${isUpdate ? 'actualizar' : 'guardar'}:`, error);
            // El error 400 casi siempre es un fallo en el lado del servidor, como un error en el mapeo
            const apiMessage = error.response?.data?.message || `Error 400: Verifique que el servidor acepte MultipartFile y ProductoDto.`;
            setErrors({ api: apiMessage });
            Swal.fire({
                title: 'Error de API',
                text: apiMessage,
                icon: 'error',
                confirmButtonColor: '#3E6770'
            });
        });
    }

    function handleCancel() {
        navegar('/producto');
    }

    return (
        <div className="page-wrap">
            <div className="container">
                <div className="row justify-content-center">
                    {/* Contenedor centralizado para el formulario */}
                    <div className="col-lg-8 col-md-10">
                        <div className="card-custom">
                            <div className="card-header">
                                {/* 💡 Título Dinámico */}
                                <h2 className="card-title">{pageTitulo()}</h2>
                            </div>
                            <div className="card-body p-4"> {/* Agrega padding aquí */}
                                <form onSubmit={saveProducto} noValidate>
                                    
                                    {/* Mensaje de error de API */}
                                    {errors.api && (
                                        <div className="alert alert-danger mb-4 d-flex align-items-center" role="alert">
                                            <X className="me-2" size={20} />
                                            {errors.api}
                                        </div>
                                    )}

                                    {/* 1. Nombre */}
                                    <div className="form-group mb-3">
                                        <label htmlFor="nombre" className="form-label d-flex align-items-center">
                                            <Package size={18} className="me-2" />
                                            Nombre del producto
                                        </label>
                                        <input
                                            id="nombre"
                                            name="nombre"
                                            type="text"
                                            className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                            value={nombre}
                                            onChange={actualizaNombre}
                                            placeholder="Ej. Tacos al Pastor"
                                            aria-label="Nombre del producto"
                                        />
                                        {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                                    </div>

                                    {/* 2. Descripción */}
                                    <div className="form-group mb-3">
                                        <label htmlFor="descripcion" className="form-label d-flex align-items-center">
                                            <FileText size={18} className="me-2" />
                                            Descripción
                                        </label>
                                        <textarea
                                            id="descripcion"
                                            name="descripcion"
                                            className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                                            value={descripcion}
                                            onChange={actualizaDescripcion}
                                            placeholder="Características del producto (ej. 3 piezas de cerdo marinado con piña)"
                                            rows="3"
                                        />
                                        {errors.descripcion && <div className="invalid-feedback">{errors.descripcion}</div>}
                                    </div>

                                    {/* 3. Precio */}
                                    <div className="form-group mb-3">
                                        <label htmlFor="precio" className="form-label d-flex align-items-center">
                                            <DollarSign size={18} className="me-2" />
                                            Precio
                                        </label>
                                        <input
                                            id="precio"
                                            name="precio"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className={`form-control ${errors.precio ? 'is-invalid' : ''}`}
                                            value={precio}
                                            onChange={actualizaPrecio}
                                            placeholder="15.00"
                                            aria-label="Precio del producto"
                                        />
                                        {errors.precio && <div className="invalid-feedback">{errors.precio}</div>}
                                    </div>

                                    {/* 4. Tipo de Producto */}
                                    <div className="form-group mb-3">
                                        <label htmlFor="idTipo" className="form-label d-flex align-items-center">
                                            <Tag size={18} className="me-2" />
                                            Tipo de producto
                                        </label>
                                        {loadingTipos ? (
                                            <div className="form-control text-muted" style={{ padding: "0.625rem 0.875rem" }}>
                                                Cargando tipos...
                                            </div>
                                        ) : errorTipos ? (
                                            <div className="form-control is-invalid" style={{ color: "var(--rojo-delete)" }}>
                                                {errorTipos}
                                            </div>
                                        ) : (
                                            <>
                                                <select
                                                    id="idTipo"
                                                    name="idTipo"
                                                    className={`form-control ${errors.idTipo ? 'is-invalid' : ''}`}
                                                    value={idTipo}
                                                    onChange={actualizaIdTipo}
                                                    aria-label="Seleccionar tipo de producto"
                                                >
                                                    <option value="">Selecciona un tipo</option>
                                                    {tipos.map((tipo) => (
                                                        <option key={tipo.id} value={tipo.id}>
                                                            {tipo.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.idTipo && <div className="invalid-feedback">{errors.idTipo}</div>}
                                            </>
                                        )}
                                    </div>

                                    {/* 5. Subida de Imagen */}
                                    <div className="form-group mb-4">
                                        <label htmlFor="fileUpload" className="form-label d-flex align-items-center">
                                            <Camera size={18} className="me-2" />
                                            Imagen del Platillo (JPG/PNG)
                                        </label>
                                        <input
                                            id="fileUpload"
                                            type="file"
                                            className={`form-control ${errors.file ? 'is-invalid' : ''}`}
                                            accept="image/png, image/jpeg"
                                            onChange={handleFileChange}
                                        />
                                        {errors.file && <div className="invalid-feedback">{errors.file}</div>}
                                        {urlImagenActual && (
                                            <small className="form-text text-muted mt-2 d-block">
                                                Imagen actual: <a href={urlImagenActual} target="_blank" rel="noopener noreferrer">Ver</a>
                                                (Sube un nuevo archivo para reemplazar)
                                            </small>
                                        )}
                                    </div>


                                    {/* 6. Botones de Acción */}
                                    <div className="form-actions border-top pt-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-rosa"
                                            onClick={handleCancel}
                                        >
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-rosa ms-2">
                                            {id ? "Actualizar Producto" : "Guardar Producto"}
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

export default ProductoComponent;