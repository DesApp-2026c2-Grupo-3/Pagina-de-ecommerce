// Valores de la pantalla de pedidos del panel (plan responsivo de Pedidos, 4.1 y 4.2)

// Las filas compactas son ~3 veces más bajas que las tarjetas anteriores
export const POR_PAGINA_PEDIDOS = 12

// Cola de ingreso: los pedidos nuevos entran a la lista de a uno
export const COOLDOWN_INGRESO_MS = 1500
// Con más de UMBRAL_RAFAGA pedidos esperando, la cola se vacía más rápido
export const COOLDOWN_RAFAGA_MS = 500
export const UMBRAL_RAFAGA = 5
// Tras sacar el puntero o el foco de la lista, se espera esto antes de seguir insertando
export const PAUSA_TRAS_INTERACCION_MS = 800

// Recuadro ámbar + «Nuevo» desde que el pedido se muestra
export const DURACION_RESALTADO_MS = 4000

// Acción rápida de la tarjeta: tiempo para el segundo clic que confirma
export const DURACION_CONFIRMACION_RAPIDA_MS = 4000
