const bcrypt = require('bcrypt');

const { Repartidor } = require('../../models');
const { firmarTokenRepartidor } = require('../../services/authService');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const emailNormalizado = email.trim().toLowerCase();

        const repartidor = await Repartidor.findOne({
            where: { email: emailNormalizado },
            include: [{
                association: 'Sucursal',
                attributes: ['id', 'nombre']
            }]
        });

        if (!repartidor || !repartidor.activo) {
            return res.status(401).json({
                code: 'email-password-incorrectos'
            });
        }

        const passwordCorrecta = await bcrypt.compare(
            password,
            repartidor.password
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                code: 'email-password-incorrectos'
            });
        }

        const token = firmarTokenRepartidor(repartidor);

        return res.status(200).json({
            token,
            repartidor: {
                id: repartidor.id,
                nombre: repartidor.nombre,
                apellido: repartidor.apellido,
                email: repartidor.email,
                sucursalId: repartidor.sucursalId,
                Sucursal: repartidor.Sucursal,
            },
        });

    } catch (error) {
        console.error('Error al loguear repartidor:', error.message);
        return res.status(500).json({
            mensaje: 'Error al iniciar sesión'
        });
    }
};

const obtenerSesion = async (req, res) => {
    try {
        const repartidor = await Repartidor.findByPk(req.repartidor.id, {
            attributes: { exclude: ['password'] },
            include: [{
                association: 'Sucursal',
                attributes: ['id', 'nombre']
            }]
        });

        if (!repartidor || !repartidor.activo) {
            return res.status(401).json({
                mensaje: 'La sesión no es válida'
            });
        }

        return res.status(200).json(repartidor);

    } catch (error) {
        console.error('Error al obtener sesión:', error.message);
        return res.status(500).json({
            mensaje: 'Error al consultar la sesión'
        });
    }
};

module.exports = { login, obtenerSesion };