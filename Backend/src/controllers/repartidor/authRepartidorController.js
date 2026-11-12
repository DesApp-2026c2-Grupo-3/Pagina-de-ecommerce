const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { Repartidor } = require('../../models');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const emailNormalizado = email.trim().toLowerCase();

        const repartidor = await Repartidor.findOne({
            where: { email: emailNormalizado }
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

        const SECRET_JWT_REPARTIDOR = process.env.SECRET_JWT_REPARTIDOR;

        const token = jwt.sign(
            {
                id: repartidor.id,
                sucursalId: repartidor.sucursalId
            },
            SECRET_JWT_REPARTIDOR,
            { expiresIn: '7d' }
        );

        return res.cookie('repartidor_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        }).status(200).json({
            id: repartidor.id,
            nombre: repartidor.nombre,
            apellido: repartidor.apellido,
            email: repartidor.email,
            sucursalId: repartidor.sucursalId
        });

    } catch (error) {
        console.error('Error al loguear repartidor:', error.message);
        return res.status(500).json({
            mensaje: 'Error al iniciar sesión'
        });
    }
};

const logout = async (req, res) => {
    try {
        return res.clearCookie('repartidor_token', {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: process.env.NODE_ENV === 'production'
        }).status(200).json({
            mensaje: 'Sesión cerrada'
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
        return res.status(500).json({
            mensaje: 'Error al cerrar sesión'
        });
    }
};

const obtenerSesion = async (req, res) => {
    try {
        const repartidor = await Repartidor.findByPk(req.repartidor.id, {
            attributes: { exclude: ['password'] }
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

module.exports = { login, logout, obtenerSesion };