// Página de una lista. Si la página pedida quedó fuera de rango (filtros, refresco en vivo),
// se usa la última válida.
export function paginar<T>(items: T[], pagina: number, porPagina: number) {
  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina))
  const actual = Math.min(Math.max(1, pagina), totalPaginas)
  return {
    pagina: actual,
    totalPaginas,
    items: items.slice((actual - 1) * porPagina, actual * porPagina),
  }
}
