const jwt = require('jsonwebtoken');

const SECRETO = process.env.JWT_SECRET;
if (!SECRETO) {
    throw new Error('Falta JWT_SECRET en el .env del backend');
}

// Crea un token con los datos indicados, válido por el tiempo indicado (ej: '8h', '7d')
const firmarToken = (datos, duracion) => jwt.sign(datos, SECRETO, { expiresIn: duracion });

// Devuelve los datos del token, o lanza un error si es falso o venció
const verificarToken = (token) => jwt.verify(token, SECRETO);

module.exports = { firmarToken, verificarToken };