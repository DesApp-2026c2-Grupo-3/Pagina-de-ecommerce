// Lo que ve el repartidor (plan UX, 7.4). Combina el socket con la red del navegador.
export type EstadoConexion = 'en_linea' | 'conectando' | 'reconectando' | 'sin_red'

// La franja aparece si el corte dura más de 3 s; al volver, muestra "volvió" 2 s
export type FranjaConexion = 'oculta' | 'reconectando' | 'sin_red' | 'volvio'
