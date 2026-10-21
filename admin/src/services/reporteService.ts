const API_URL = "http://localhost:3000/admin/reportes";

function construirUrlReporte(
  endpoint: string,
  sucursalId?: number,
): string {
  const parametros = new URLSearchParams();

  if (sucursalId !== undefined) {
    parametros.set("sucursalId", String(sucursalId));
  }

  const query = parametros.toString();

  return `${API_URL}/${endpoint}${query ? `?${query}` : ""}`;
}

export interface ProductoMasVendido {
  productoId: number;
  unidadesVendidas: string | number;
  Producto: {
    nombre: string;
    imagen: string | null;
  };
}

export async function obtenerProductosMasVendidos(
  sucursalId?: number,
): Promise<ProductoMasVendido[]> {
  const respuesta = await fetch(
    construirUrlReporte("productos-mas-vendidos", sucursalId),
    { credentials: "include" },
  );

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || datos.msj || "Error al obtener los productos más vendidos",
    );
  }

  return datos;
}

//------------------------------------------------------

export interface ProductoMenosVendido {
  productoId: number;
  nombre: string;
  imagen: string | null;
  unidadesVendidas: string | number;
}

export async function obtenerProductosMenosVendidos(
  sucursalId?: number,
): Promise<ProductoMenosVendido[]> {
  const respuesta = await fetch(
    construirUrlReporte("productos-menos-vendidos", sucursalId),
    { credentials: "include" },
  );

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
        datos.msj ||
        "Error al obtener los productos menos vendidos",
    );
  }

  return datos;
}

//---------------------------------------------------------

export interface ProductoMayorFacturacion {
  productoId: number;
  nombre: string;
  imagen: string | null;
  facturacion: string | number;
}

export async function obtenerProductosMayorFacturacion(
  sucursalId?: number,
): Promise<ProductoMayorFacturacion[]> {
  const respuesta = await fetch(
    construirUrlReporte("productos-mayor-facturacion", sucursalId),
    { credentials: "include" },
  );

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
        datos.msj ||
        "Error al obtener el reporte de facturación",
    );
  }

  return datos;
}

//---------------------------------------------------------

export interface ProductoSinStock {
  productoId: number;
  nombre: string;
  imagen: string | null;
  sucursalId: number;
  sucursalNombre: string;
  unidadesDisponibles: number;
  insumoLimitante: string | null;
}

export async function obtenerProductosSinStock(
  sucursalId?: number,
): Promise<ProductoSinStock[]> {
  const parametros = new URLSearchParams();

  if (sucursalId !== undefined) {
    parametros.set("sucursalId", String(sucursalId));
  }

  const query = parametros.toString();
  const url = `${API_URL}/productos-sin-stock${query ? `?${query}` : ""}`;

  const respuesta = await fetch(url, {
    credentials: "include",
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
        datos.msj ||
        "Error al obtener los productos sin stock",
    );
  }

  return datos;
}