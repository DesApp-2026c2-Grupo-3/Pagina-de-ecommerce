const API_URL = "http://localhost:3000/geo";

// Sugerencia mientras se escribe
export interface GeoSugerencia {
  placeId: string;
  principal: string; // ej: "Florida 2950"
  secundario: string; // ej: "Merlo, Provincia de Buenos Aires"
}

// Dirección completa
export interface GeoResultado {
  direccionCompleta: string;
  calle: string | null;
  altura: number | null;
  localidad: string | null;
  departamento: string | null;
  provincia: string | null;
  codigoPostal: string | null;
  latitud: number | null;
  longitud: number | null;
}

async function pedir<T>(url: string, porDefecto: string): Promise<T> {
  const respuesta = await fetch(url);
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.code || datos.mensaje || porDefecto);
  return datos;
}

export function autocompletarDireccion(q: string, sessionToken: string) {
  const params = new URLSearchParams({ q, sessionToken });
  return pedir<GeoSugerencia[]>(`${API_URL}/autocompletar?${params}`, "Error al buscar la dirección");
}

export function detalleDireccion(placeId: string, sessionToken: string) {
  const params = new URLSearchParams({ sessionToken });
  return pedir<GeoResultado>(
    `${API_URL}/detalle/${encodeURIComponent(placeId)}?${params}`,
    "No se pudo cargar la dirección",
  );
}

export function direccionDesdeCoordenadas(lat: number, lon: number) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  return pedir<GeoResultado>(`${API_URL}/reverse?${params}`, "No pudimos obtener la dirección");
}