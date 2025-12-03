import React from "react";
import { Tag, FileText, Pencil, Trash2 } from "lucide-react";

/**
 * Componente que renderiza una tarjeta para mostrar la información de un Tipo de Producto.
 * @param {object} tipo - Objeto con los datos del tipo (id, tipo, descripcion).
 * @param {function} onEdit - Handler para iniciar la edición.
 * @param {function} onDelete - Handler para iniciar la eliminación.
 */
export function TipoCard({ tipo, onEdit, onDelete }) {
    
    // Asumimos que el campo que contiene el nombre del tipo es 'tipo' o 'nombre'
    const nombreTipo = tipo.tipo || tipo.nombre; 
    
    return (
        <div className="cliente-card card-custom">
            <div className="d-flex align-items-start justify-content-between">
                
                <div className="flex-grow-1 min-w-0">
                    {/* Título: Nombre del Tipo */}
                    <h3 className="card-name mb-2">{nombreTipo}</h3>

                    <div className="space-y-2 card-contact-info-short">
                        
                        {/* ID del Tipo (Referencia) */}
                        <div className="contact-item">
                            <Tag className="icon me-2" size={16} />
                            <span className="truncate fw-semibold text-primary">ID: {tipo.id}</span>
                        </div>
                        
                        {/* Descripción */}
                        <div className="contact-item">
                            <FileText className="icon me-2" size={16} />
                            {/* Mostrar una descripción corta o un placeholder */}
                            <span className="text-muted text-sm">
                                {tipo.descripcion ? tipo.descripcion.substring(0, 50) + (tipo.descripcion.length > 50 ? '...' : '') : "Sin descripción"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Botones de Acción */}
                <div className="d-flex gap-2 ms-4 card-actions-buttons">
                    {/* Botón de Editar */}
                    <button
                        className="btn-icon btn-edit"
                        onClick={() => onEdit(tipo.id)}
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </button>
                    {/* Botón de Eliminar */}
                    <button
                        className="btn-icon btn-delete"
                        onClick={() => onDelete(tipo)} // Pasamos el objeto completo para el SweetAlert de confirmación
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}