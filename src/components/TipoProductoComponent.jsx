// src/components/TipoProductoComponent.jsx
import React, { useState, useEffect } from "react";
// 💡 Importamos las funciones de edición y obtención por ID
import { crearTipo, getTipo, updateTipo } from "../services/TipoService"; 
import { useNavigate, useParams } from "react-router-dom";
import Swal from 'sweetalert2';
import { Tag, FileText, X } from "lucide-react"; 

export const TipoProductoComponent = () => {
    const [tipo, setTipo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [errors, setErrors] = useState({});
    
    const { id } = useParams(); // Para obtener el ID si estamos en modo edición
    const navegar = useNavigate();

    // --- Handlers de Actualización ---
    const actualizaTipo = (e) => { setTipo(e.target.value); }
    const actualizaDescripcion = (e) => { setDescripcion(e.target.value); }

    // --- Lógica de Carga para Edición ---
    useEffect(() => {
        if (id) {
            getTipo(id).then((res) => {
                // Mapeamos los datos de la API al estado local
                setTipo(res.data.tipo || ""); 
                setDescripcion(res.data.descripcion || "");
            }).catch((error) => {
                console.error("Error al cargar el tipo:", error);
                setErrors({ api: "No se pudo cargar la información del tipo para edición." });
            });
        }
    }, [id]);

    // --- Título Dinámico ---
    function pageTitulo() {
        return id ? "Actualizar Tipo de Producto" : "Registrar Tipo de Producto";
    }

    // --- Validación de Formulario ---
    function validarFormulario() {
        const newErrors = {};
        let isValid = true;

        if (!tipo.trim()) { 
            newErrors.tipo = "El nombre del tipo es obligatorio."; 
            isValid = false; 
        }

        if (!descripcion.trim()) {
            newErrors.descripcion = "La descripción es obligatoria.";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    }

    // --- Guardar/Actualizar Lógica ---
    function saveTipo(e) {
        e.preventDefault();
        
        if (!validarFormulario()) {
             Swal.fire({
                title: 'Error de Validación',
                text: 'Por favor, completa los campos obligatorios.',
                icon: 'error',
                confirmButtonColor: '#3E6770'
            });
            return;
        }

        const tipoProducto = { tipo, descripcion };
        const isUpdate = !!id; 

        // 💡 Lógica central para decidir si crear o actualizar
        const promise = isUpdate 
            ? updateTipo(id, tipoProducto) 
            : crearTipo(tipoProducto);

        promise.then(() => {
            const successMsg = isUpdate 
                ? 'Tipo de producto actualizado con éxito.' 
                : 'Tipo de producto guardado con éxito.';
            
            Swal.fire('¡Éxito!', successMsg, 'success');
            navegar('/tipo');
        })
        .catch((error) => {
            console.error("Error al guardar/actualizar el tipo:", error);
            const apiMessage = error.response?.data?.message || `Error al ${isUpdate ? 'actualizar' : 'guardar'} el tipo en el servidor.`;
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
        navegar('/tipo');
    }

    return (
        <div className="page-wrap">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-6 col-md-8">
                        <div className="card-custom">
                            <div className="card-header">
                                <h2 className="card-title">{pageTitulo()}</h2>
                            </div>
                            <div className="card-body p-4">
                                <form onSubmit={saveTipo} noValidate>
                                
                                    {errors.api && (
                                        <div className="alert alert-danger mb-4 d-flex align-items-center" role="alert">
                                            <X size={20} className="me-2" />
                                            {errors.api}
                                        </div>
                                    )}

                                    {/* 1. Tipo de producto (Nombre) */}
                                    <div className="form-group mb-3">
                                        <label htmlFor="tipo" className="form-label d-flex align-items-center">
                                            <Tag size={18} className="me-2" />
                                            Nombre del Tipo de producto
                                        </label>
                                        <input
                                            id="tipo"
                                            name="tipo"
                                            type="text"
                                            className={`form-control ${errors.tipo ? 'is-invalid' : ''}`}
                                            value={tipo}
                                            onChange={actualizaTipo}
                                            placeholder="Ej. Postres, Bebidas"
                                            aria-label="Nombre del tipo de producto"
                                        />
                                        {errors.tipo && <div className="invalid-feedback">{errors.tipo}</div>}
                                    </div>

                                    {/* 2. Descripción */}
                                    <div className="form-group mb-4">
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
                                            placeholder="Breve descripción del tipo de producto (Ej. Platos dulces y fríos)."
                                            rows="3"
                                        />
                                        {errors.descripcion && <div className="invalid-feedback">{errors.descripcion}</div>}
                                    </div>

                                    {/* 3. Botones de Acción */}
                                    <div className="form-actions border-top pt-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-rosa"
                                            onClick={handleCancel}
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-rosa ms-2"
                                        >
                                            {id ? "Actualizar Tipo" : "Guardar Tipo"}
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

export default TipoProductoComponent;