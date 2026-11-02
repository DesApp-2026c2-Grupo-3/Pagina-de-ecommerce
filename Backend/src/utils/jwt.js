const jwt = require('jsonwebtoken');

function obtenerSecreto() {
    const secreto = process.env.SECRET_JWT_TOKEN;
    if (!secreto) {
        throw new Error('Falta SECRET_JWT_TOKEN en el .env del backend');
    }
    return secreto;
}

// Crea un token con los datos indicados, válido por el tiempo indicado (ej: '8h', '7d')
const firmarToken = (datos, duracion) => jwt.sign(datos, obtenerSecreto(), { expiresIn: duracion });

// Devuelve los datos del token, o lanza un error si es falso o venció
const verificarToken = (token) => jwt.verify(token, obtenerSecreto());

module.exports = { firmarToken, verificarToken };
