export function leerIdPositivo(valor: string | null): number | null {
  if (valor === null || valor.trim() === '') return null

  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}
