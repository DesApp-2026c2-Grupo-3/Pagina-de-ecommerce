const API_URL = "http://localhost:3000/admin/reportes";

export interface ProductoMasVendido {
  productoId: number;
  unidadesVendidas: string | number;
  Producto: {
    nombre: string;
    imagen: string | null;
  };
}

export async function obtenerProductosMasVendidos(): Promise<ProductoMasVendido[]> {
  const respuesta = await fetch(`${API_URL}/productos-mas-vendidos`, {
    credentials: "include",
  });

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

export async function obtenerProductosMenosVendidos(): Promise<ProductoMenosVendido[]> {
  const respuesta = await fetch(
    `${API_URL}/productos-menos-vendidos`,
    {
      credentials: "include",
    },
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

export async function obtenerProductosMayorFacturacion(): Promise<ProductoMayorFacturacion[]> {
  const response = await fetch(
    `${API_URL}/productos-mayor-facturacion`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener el reporte de facturación");
  }

  return response.json();
}