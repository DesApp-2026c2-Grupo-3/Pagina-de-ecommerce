const API_URL = "http://localhost:3000/admin/insumos";

export interface Insumo {
  id: number;
  nombre: string;
  unidadMedida: string;
  precioComercial: string | number | null;
}

export interface DatosInsumo {
  nombre: string;
  unidadMedida: string;
  precioComercial: number | null;
}

async function pedir(url: string, opciones: RequestInit, porDefecto: string) {
  const respuesta = await fetch(url, opciones);
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.code || datos.mensaje || porDefecto);
  }
  return datos;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export function obtenerInsumos(): Promise<Insumo[]> {
  return pedir(`${API_URL}/`, {}, "Error al obtener los insumos");
}

export function crearInsumo(datos: DatosInsumo) {
  return pedir(`${API_URL}/nuevo`, json("POST", datos), "Error al crear el insumo");
}

export function actualizarInsumo(id: number, datos: DatosInsumo) {
  return pedir(`${API_URL}/editar/${id}`, json("PATCH", datos), "Error al editar el insumo");
}

export function eliminarInsumo(id: number) {
  return pedir(`${API_URL}/eliminar/${id}`, { method: "DELETE" }, "Error al eliminar el insumo");
}