const errorMessages: Record<string, string> = {
  'email-en-uso': 'Ese email ya está registrado. Probá con otro o iniciá sesión.',
  'email-password-incorrectos': 'Email o contraseña incorrectos.',
  'password-actual-requerida': 'Ingresá tu contraseña actual para poder cambiarla.',
  'password-actual-incorrecta': 'La contraseña actual no es correcta.',
}

export function traducirError(code: string): string {
  if (errorMessages[code]) return errorMessages[code]

  // Si el mensaje viene con jerga técnica de Joi/regex, mostramos algo genérico
  if (code.includes('pattern') || code.includes('fails to match')) {
    return 'Uno de los campos tiene un formato no válido. Revisá los datos ingresados.'
  }

  return code
}