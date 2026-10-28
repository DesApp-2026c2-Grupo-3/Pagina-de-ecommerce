// El personal (encargados y empleados) usa mail laboral. El dominio es exclusivo:
// un cliente no puede registrarse con un mail @burgerfast.com.
const DOMINIO_PERSONAL = '@burgerfast.com';

const esEmailDePersonal = (email) =>
    typeof email === 'string' && email.trim().toLowerCase().endsWith(DOMINIO_PERSONAL);

module.exports = { DOMINIO_PERSONAL, esEmailDePersonal };
