const API_URL = "http://localhost:3000/admin/stock";

export async function obtenerStockPorSucursal(sucursalId: number) {
  const respuesta = await fetch(`${API_URL}/sucursal/${sucursalId}`);

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.code ||
      datos.mensaje ||
      "Error al obtener el stock"
    );
  }

  return datos;
}

export async function cargarAumento(
  id: number,
  cantidad: number
) {
  const respuesta = await fetch(
    `${API_URL}/${id}/aumentar`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cantidad }),
    }
  )

  const datos = await respuesta.json()

  if (!respuesta.ok) {
    throw new Error(
      datos.code ||
      datos.mensaje ||
      'Error al cargar stock'
    )
  }

  return datos
}