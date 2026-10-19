import type { PayloadSucursal, Sucursal } from "../types/sucursal";

const API_URL = "http://localhost:3000/admin/sucursales";

export interface RespuestaSucursal {
  mensaje?: string;
  sucursal: Sucursal;
}

// Usa el mensaje que manda el backend ({ code } de las validaciones, o { mensaje }),
// o uno por defecto si no vino ninguno
async function errorDe(respuesta: Response, porDefecto: string) {
  try {
    const datos = await respuesta.json();
    return new Error(datos.code ?? datos.mensaje ?? porDefecto);
  } catch {
    return new Error(porDefecto);
  }
}

export async function obtenerSucursales(): Promise<Sucursal[]> {
  const respuesta = await fetch(`${API_URL}`, {
    credentials: "include",
  });

  if (!respuesta.ok) {
    throw await errorDe(respuesta, "Error al obtener las sucursales");
  }

  return respuesta.json();
}

export async function obtenerSucursalPorId(id: number): Promise<Sucursal> {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    credentials: "include",
  });

  if (!respuesta.ok) {
    throw await errorDe(respuesta, "Error al obtener la sucursal");
  }

  return respuesta.json();
}

export async function crearSucursal(
  sucursal: PayloadSucursal,
): Promise<RespuestaSucursal> {
  const respuesta = await fetch(`${API_URL}/nueva`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: JSON.stringify(sucursal),
  });

  if (!respuesta.ok) {
    throw await errorDe(respuesta, "Error al crear la sucursal");
  }

  return respuesta.json();
}

export async function actualizarSucursal(
  id: number,
  sucursal: PayloadSucursal,
): Promise<RespuestaSucursal> {
  const respuesta = await fetch(`${API_URL}/editar/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: JSON.stringify(sucursal),
  });

  if (!respuesta.ok) {
    throw await errorDe(respuesta, "Error al actualizar la sucursal");
  }

  return respuesta.json();
}

export async function cambiarEstadoSucursal(
  id: number,
  activa: boolean,
): Promise<RespuestaSucursal> {
  const respuesta = await fetch(`${API_URL}/estado/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: JSON.stringify({ activa }),
  });

  if (!respuesta.ok) {
    throw await errorDe(respuesta, "Error al cambiar el estado de la sucursal");
  }

  return respuesta.json();
}
