const jwt = require('jsonwebtoken');
const { Repartidor } = require('../../models');

const limpiarCookieRepartidor = (res) => {
    res.clearCookie('repartidor_token', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
    });
};

const esRepartidorJwt = async (req, res, next) => {
    try {
        const token = req.cookies?.repartidor_token;

        if (!token) {
            return res.status(401).json({
                mensaje: 'No hay una sesión de repartidor activa'
            });
        }

        const SECRET_JWT_REPARTIDOR = process.env.SECRET_JWT_REPARTIDOR;

        if (!SECRET_JWT_REPARTIDOR) {
            console.error('Falta configurar SECRET_JWT_REPARTIDOR');
            return res.status(500).json({
                mensaje: 'Error de configuración del servidor'
            });
        }

        let datosToken;

        try {
            datosToken = jwt.verify(token, SECRET_JWT_REPARTIDOR);
        } catch (error) {
            limpiarCookieRepartidor(res);
            return res.status(401).json({
                mensaje: 'La sesión es inválida o expiró'
            });
        }

        const repartidor = await Repartidor.findByPk(datosToken.id);

        if (!repartidor || !repartidor.activo) {
            limpiarCookieRepartidor(res);
            return res.status(401).json({
                mensaje: 'La sesión no es válida o el repartidor está inactivo'
            });
        }

        req.repartidor = {
            id: repartidor.id,
            sucursalId: repartidor.sucursalId
        };

        return next();

    } catch (error) {
        console.error('Error al autenticar repartidor:', error.message);
        return res.status(500).json({
            mensaje: 'Error al verificar la sesión'
        });
    }
};

module.exports = { esRepartidorJwt };