const API = "http://localhost:3000";
const API_URL = `${API}/admin/productos`;

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

export async function obtenerProductos() {
  const respuesta = await fetch(`${API_URL}/`);
  if (!respuesta.ok) throw await errorDe(respuesta, "Error al obtener los productos");
  return respuesta.json();
}

export async function obtenerProductoPorId(id: number) {
  const respuesta = await fetch(`${API_URL}/${id}`);
  if (!respuesta.ok) throw await errorDe(respuesta, "Error al obtener el producto");
  return respuesta.json();
}

export async function crearProducto(producto: unknown) {
  const respuesta = await fetch(`${API_URL}/nuevo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });
  if (!respuesta.ok) throw await errorDe(respuesta, "Error al crear el producto");
  return respuesta.json();
}

export async function actualizarProducto(id: number, producto: unknown) {
  const respuesta = await fetch(`${API_URL}/editar/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });
  if (!respuesta.ok) throw await errorDe(respuesta, "Error al actualizar el producto");
  return respuesta.json();
}

export async function eliminarProducto(id: number) {
  const respuesta = await fetch(`${API_URL}/eliminar/${id}`, { method: "DELETE" });
  if (!respuesta.ok) throw await errorDe(respuesta, "Error al eliminar el producto");
}

// Para elegir los ingredientes de la receta
export async function obtenerInsumos() {
  const respuesta = await fetch(`${API}/admin/insumos`);
  if (!respuesta.ok) throw await errorDe(respuesta, "Error al obtener los insumos");
  return respuesta.json();
}

// Regular, mediano y grande, en orden
export async function obtenerTamanios() {
  const respuesta = await fetch(`${API}/tamanios`);
  if (!respuesta.ok) throw await errorDe(respuesta, "Error al obtener los tamaños");
  return respuesta.json();
}

// Por sucursal, cuántas unidades se pueden preparar con el stock actual
export async function verStockProducto(id: number) {
  const respuesta = await fetch(`${API_URL}/${id}/stock`);
  if (!respuesta.ok) throw await errorDe(respuesta, "Error al obtener el stock del producto");
  return respuesta.json();
}