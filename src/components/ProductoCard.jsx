import React from "react";
import { Tag, FileText, Pencil, Trash2, Image, DollarSign } from "lucide-react";

export const BASE_URL = import.meta.env.VITE_FONDA_URL || 'http://localhost:8081';

import { BASE_URL } from "../services/ProductoService";

export function ProductoCard({ producto, nombreTipo, onEdit, onDelete }) {
    const formatPrice = (price) => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price);
    };

    return (
        <div className="producto-card card-custom">
            <div className="producto-card-content">
                {/* Contenedor de imagen mejorado */}
                <div className="card-media-container">
                    {producto.urlImagen ? (
                        <img
                            src={`${BASE_URL}/imagenes/${producto.urlImagen}`}
                            alt={producto.nombre}
                            className="producto-imagen-listado"
                            loading="lazy"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/placeholder-error.jpg";
                                e.target.classList.add("image-error");
                            }}
                        />
                    ) : (
                        <div className="producto-imagen-placeholder">
                            <Image size={24} className="text-muted" />
                            <small className="text-muted mt-1">Sin Imagen</small>
                        </div>
                    )}
                </div>

                {/* Información del producto */}
                <div className="producto-info">
                    <div className="producto-header">
                        <h3 className="producto-nombre">{producto.nombre}</h3>
                        {(onEdit || onDelete) && (
                            <div className="producto-actions">

                                {/* Botón Editar: Solo si onEdit existe (Admin/Supervisor) */}
                                {onEdit && (
                                    <button
                                        className="btn-icon btn-edit"
                                        onClick={() => onEdit(producto.idProducto)}
                                        title="Editar producto"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                )}

                                {/* Botón Eliminar: Solo si onDelete existe (Admin/Supervisor) */}
                                {onDelete && (
                                    <button
                                        className="btn-icon btn-delete"
                                        onClick={() => onDelete(producto.idProducto)}
                                        title="Eliminar producto"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="producto-details">
                        {/* Tipo de Producto con badge */}
                        <div className="producto-detail-item">
                            <Tag className="icon" size={16} />
                            <span className="producto-tipo-badge">{nombreTipo}</span>
                        </div>

                        {/* Precio destacado */}
                        <div className="producto-detail-item precio-destacado">
                            <DollarSign className="icon" size={16} />
                            <span className="producto-precio">{formatPrice(producto.precio)}</span>
                        </div>

                        {/* Descripción con truncado */}
                        <div className="producto-detail-item">
                            <FileText className="icon" size={16} />
                            <span className="producto-descripcion">
                                {producto.descripcion || "Sin descripción"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}