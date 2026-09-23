const API_URL = "http://localhost:3000/admin/productos";

export async function obtenerProductos() {
  const respuesta = await fetch(`${API_URL}/`);

  if (!respuesta.ok) {
    throw new Error("Error al obtener los productos");
  }
  return respuesta.json();
}

export async function obtenerProductoPorId(id: number) {
  const respuesta = await fetch(`${API_URL}/${id}`);

  if (!respuesta.ok) {
    throw new Error("Error al obtener el producto");
  }

  return respuesta.json();
}

export async function crearProducto(producto: unknown) {
  const respuesta = await fetch(`${API_URL}/nuevo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(producto),
  });

  if (!respuesta.ok) {
    throw new Error("Error al crear el producto");
  }

  return respuesta.json();
}

export async function actualizarProducto(id: number, producto: unknown) {
  const respuesta = await fetch(`${API_URL}/editar/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(producto),
  });

  if (!respuesta.ok) {
    throw new Error("Error al actualizar el producto");
  }

  return respuesta.json();
}

export async function eliminarProducto(id: number) {
  const respuesta = await fetch(`${API_URL}/eliminar/${id}`, {
    method: "DELETE",
  });

  if (!respuesta.ok) {
    throw new Error("Error al eliminar el producto");
  }
}
