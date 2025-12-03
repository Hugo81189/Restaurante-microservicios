// src/components/ClienteCard.jsx (Correcto, no requiere cambios de lógica)
import React from "react";
import { Mail, Phone, Pencil, Trash2 } from "lucide-react";
// Asumo que tienes clases de Bootstrap/utility como 'd-flex', 'justify-content-between', etc.

export function ClienteCard({ cliente, onEdit, onDelete }) {
    return (
        <div className="cliente-card card-custom">
            <div className="d-flex align-items-start justify-content-between">
                <div className="flex-grow-1 min-w-0">
                    {/* 💡 Muestra el nombre correctamente */}
                    <h3 className="card-name mb-3">{cliente.nombre}</h3> 

                    <div className="space-y-2">
                        <div className="contact-item">
                            <Mail className="icon me-2" size={16} />
                            <span className="truncate">{cliente.correo}</span>
                        </div>

                        <div className="contact-item">
                            <Phone className="icon me-2" size={16} />
                            <span>{cliente.telefono || "N/A"}</span>
                        </div>
                    </div>
                </div>

                <div className="d-flex gap-2 ms-4 card-actions-buttons">
                    <button
                        className="btn-icon btn-edit"
                        onClick={() => onEdit(cliente.id)}
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        className="btn-icon btn-delete"
                        onClick={() => onDelete(cliente.id)}
                        title="Inhabilitar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}