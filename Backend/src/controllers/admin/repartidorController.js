
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { Repartidor, Sucursal } = require('../../models');

const SUCURSAL = {
    model: Sucursal,
    attributes: ['id', 'nombre'],
};

function datosDe(repartidor) {
    return {
        id: repartidor.id,
        nombre: repartidor.nombre,
        apellido: repartidor.apellido,
        email: repartidor.email,
        sucursalId: repartidor.sucursalId,
        sucursal: repartidor.Sucursal
            ? {
                id: repartidor.Sucursal.id,
                nombre: repartidor.Sucursal.nombre,
            }
            : null,
        activo: repartidor.activo,
        createdAt: repartidor.createdAt,
    };
}

async function validarSucursal(sucursalId) {
    if (!sucursalId) {
        return 'Elegí la sucursal del repartidor';
    }

    const sucursal = await Sucursal.findByPk(sucursalId);

    if (!sucursal || !sucursal.activa) {
        return 'La sucursal elegida no existe o está inactiva';
    }

    return '';
}

const verRepartidores = async (req, res) => {
    try {
        const repartidores = await Repartidor.findAll({
            attributes: [
                'id',
                'nombre',
                'apellido',
                'email',
                'sucursalId',
                'activo',
                'createdAt',
            ],
            include: [SUCURSAL],
            order: [['nombre', 'ASC']],
        });

        return res.status(200).json(
            repartidores.map(datosDe)
        );
    } catch (error) {
        console.error('Error al obtener repartidores:', error.message);
        return res.status(500).json({
            mensaje: 'Error al obtener los repartidores',
        });
    }
};

const crearRepartidor = async (req, res) => {
    try {
        const { nombre, apellido, email, password, sucursalId } = req.body;

        const nombreNormalizado = nombre.trim();
        const apellidoNormalizado = apellido.trim();
        const emailNormalizado = email.trim().toLowerCase();

        const errorSucursal = await validarSucursal(sucursalId);

        if (errorSucursal) {
            return res.status(400).json({ code: errorSucursal });
        }

        const repartidorExistente = await Repartidor.findOne({
            where: { email: emailNormalizado },
        });

        if (repartidorExistente) {
            return res.status(409).json({ code: 'email-en-uso' });
        }

        // La contraseña nunca se guarda en texto plano.
        const passwordEncriptada = await bcrypt.hash(password, 10);

        const nuevoRepartidor = await Repartidor.create({
            nombre: nombreNormalizado,
            apellido: apellidoNormalizado,
            email: emailNormalizado,
            password: passwordEncriptada,
            sucursalId,
        });

        await nuevoRepartidor.reload({
            include: [SUCURSAL],
        });

        return res.status(201).json(datosDe(nuevoRepartidor));
    } catch (error) {
        console.error('Error al crear repartidor:', error.message);
        return res.status(500).json({
            mensaje: 'Error al crear el repartidor',
        });
    }
};

module.exports = {
    verRepartidores,
    crearRepartidor,
};
