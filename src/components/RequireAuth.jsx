// src/components/RequireAuth.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../services/AuthService"; // mismo getToken que usas en el login

// Decodifica el payload del JWT (sin librerías)
function parseJwt(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const base64 = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );

        return JSON.parse(json);
    } catch (e) {
        console.error("Error al parsear JWT en RequireAuth:", e);
        return null;
    }
}

// Normaliza el rol a un string consistente: sin "ROLE_", en MAYÚSCULAS
function normalizeRole(raw) {
    if (!raw) return null;

    let r = raw;

    // Si viene como objeto { nombre: "MESERO" } o { name: "MESERO" }
    if (typeof r === "object") {
        if (r.nombre) r = r.nombre;
        else if (r.name) r = r.name;
    }

    r = String(r).toUpperCase().trim();

    // Quitar prefijo ROLE_ si lo trae (ROLE_ADMINISTRADOR -> ADMINISTRADOR)
    if (r.startsWith("ROLE_")) {
        r = r.substring(5);
    }

    return r;
}

const RequireAuth = ({ allowedRoles = [] }) => {
    const location = useLocation();

    // 1) Verificar token
    const token = getToken();
    if (!token) {
        // Sin token -> mandar a login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2) Leer roles DESDE EL TOKEN
    const payload = parseJwt(token);

    let rawRoles = [];

    if (payload) {
        // Intentamos varias claims posibles
        rawRoles =
            payload.roles ??
            payload.authorities ??
            payload.perfiles ??
            payload.permisos ??
            [];

        // Si viene un solo rol como string, lo volvemos array
        if (typeof rawRoles === "string") {
            rawRoles = [rawRoles];
        }
    }

    let rolesNorm = [];
    if (Array.isArray(rawRoles)) {
        rolesNorm = rawRoles
            .map(normalizeRole)
            .filter(Boolean);
    }

    // Logs para ver qué está leyendo realmente
    console.log("RequireAuth → roles en token:", rolesNorm);
    console.log("RequireAuth → allowedRoles prop:", allowedRoles);

    // 3) Si no hay lista de roles permitidos, con estar logueado basta
    if (!allowedRoles || allowedRoles.length === 0) {
        return <Outlet />;
    }

    const allowedNorm = allowedRoles
        .map(normalizeRole)
        .filter(Boolean);

    console.log("RequireAuth → allowed normalizados:", allowedNorm);

    // Verificar si el usuario tiene al menos uno de los roles permitidos
    const hasRole = rolesNorm.some((r) => allowedNorm.includes(r));

    if (!hasRole) {
        console.warn(
            "RequireAuth → usuario NO tiene roles permitidos para esta ruta."
        );
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 4) Todo bien → mostrar la ruta hija
    return <Outlet />;
};

export default RequireAuth;