interface ErrorSocket extends Error {
  data?: { code?: string }
}

export function codigoErrorSocket(error: unknown): string | null {
  if (!(error instanceof Error)) return null

  const codigo = (error as ErrorSocket).data?.code
  if (typeof codigo === 'string' && codigo.trim()) return codigo

  return error.message.trim() || null
}

export function esErrorAutenticacionSocket(error: unknown): boolean {
  const codigo = codigoErrorSocket(error)
  return (
    codigo === 'AUTH_REQUIRED' ||
    codigo === 'AUTH_INVALID' ||
    codigo === 'AUTH_EXPIRED'
  )
}
