const API_URL = "http://localhost:3000/admin/sucursales";

export async function obtenerSucursales() {
  const respuesta = await fetch(`${API_URL}`, {
    credentials: "include",
  });

  if (!respuesta.ok) {
    throw new Error("Error al obtener las sucursales");
  }

  return respuesta.json();
}

export async function obtenerSucursalPorId(id: number) {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    credentials: "include",
  });

  if (!respuesta.ok) {
    throw new Error("Error al obtener la sucursal");
  }

  return respuesta.json();
}

export async function crearSucursal(sucursal: unknown) {
  const respuesta = await fetch(`${API_URL}/nueva`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: JSON.stringify(sucursal),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(
      datos.code || datos.mensaje || "Error al crear la sucursal",
    );
  }

  return datos;
}

export async function actualizarSucursal(id: number, sucursal: unknown) {
  const respuesta = await fetch(`${API_URL}/editar/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: JSON.stringify(sucursal),
  });

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(
      datos.code || datos.mensaje || "Error al actualizar la sucursal",
    );
  }

  return datos;

  return respuesta.json();
}

export async function cambiarEstadoSucursal(id: number, activa: boolean) {
  const respuesta = await fetch(`${API_URL}/estado/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: JSON.stringify({ activa }),
  });

  if (!respuesta.ok) {
    throw new Error("Error al cambiar el estado de la sucursal");
  }

  return respuesta.json();
}
