const API_URL = "http://localhost:3000/admin/stock";

export const MOTIVOS_BAJA = [
  { valor: "merma", etiqueta: "Merma (se echó a perder)" },
  { valor: "vencimiento", etiqueta: "Vencimiento" },
  { valor: "rotura", etiqueta: "Rotura" },
  { valor: "faltante", etiqueta: "Faltante" },
  { valor: "correccion", etiqueta: "Corrección de carga" },
  { valor: "otro", etiqueta: "Otro" },
] as const;

async function pedir(url: string, opciones: RequestInit, porDefecto: string) {
  const respuesta = await fetch(url, opciones);
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.code || datos.mensaje || porDefecto);
  }
  return datos;
}

const patch = (body: unknown): RequestInit => ({
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify(body),
});
// Quién está logueado: queda registrado en el historial de movimientos
function adminIdSesion(): number | undefined {
  try {
    return (
      JSON.parse(localStorage.getItem("administrador") ?? "null")?.id ??
      undefined
    );
  } catch {
    return undefined;
  }
}

export function obtenerStockPorSucursal(sucursalId: number) {
  return pedir(
    `${API_URL}/sucursal/${sucursalId}`,
    {
      credentials: "include",
    },
    "Error al obtener el stock",
  );
}

export function obtenerMovimientos(sucursalId: number) {
  return pedir(
    `${API_URL}/sucursal/${sucursalId}/movimientos`,
    {
      credentials: "include",
    },
    "Error al obtener los movimientos",
  );
}

export function cargarAumento(id: number, cantidad: number) {
  return pedir(
    `${API_URL}/${id}/aumentar`,
    patch({ cantidad, adminId: adminIdSesion() }),
    "Error al cargar stock",
  );
}

export function registrarBaja(
  id: number,
  datos: { cantidad: number; motivo: string; detalle: string },
) {
  return pedir(
    `${API_URL}/${id}/bajar`,
    patch({ ...datos, adminId: adminIdSesion() }),
    "Error al registrar la baja",
  );
}
// null = sin alerta
export function definirMinimo(id: number, stockMinimo: number | null) {
  return pedir(
    `${API_URL}/${id}/minimo`,
    patch({ stockMinimo }),
    "Error al definir el mínimo",
  );
}
