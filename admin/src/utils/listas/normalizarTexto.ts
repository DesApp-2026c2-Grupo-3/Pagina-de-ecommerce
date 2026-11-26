// Texto para comparar en los buscadores: sin tildes, en minúsculas y sin espacios en los bordes
// («Café» y «cafe» coinciden). Traído del PR #78.
export const normalizarTexto = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
