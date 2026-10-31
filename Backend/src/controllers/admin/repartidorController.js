const bcrypt = require('bcrypt');
const { Repartidor, Sucursal, Viaje } = require('../../models');

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
        const where = {};
        
        if (req.usuario.rol !== 'MASTER') {
            where.sucursalId = req.usuario.sucursalId;
        }

        const repartidores = await Repartidor.findAll({
            where,
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

const obtenerRepartidorPorId = async (req, res) => {
    try {
        const repartidor = await Repartidor.findByPk(req.params.id, {
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
        });

        if (!repartidor) {
            return res.status(404).json({
                mensaje: 'Repartidor no encontrado',
            });
        }

        // Un ADMIN solamente puede consultar repartidores de su sucursal.
        if (
            req.usuario.rol !== 'MASTER' &&
            repartidor.sucursalId !== req.usuario.sucursalId
        ) {
            return res.status(403).json({
                mensaje: 'No tenés permisos para consultar este repartidor',
            });
        }

        return res.status(200).json(datosDe(repartidor));
    } catch (error) {
        console.error('Error al obtener repartidor:', error.message);
        return res.status(500).json({
            mensaje: 'Error al obtener el repartidor',
        });
    }
};

const actualizarRepartidor = async (req, res) => {
    try {
        const repartidor = await Repartidor.findByPk(req.params.id);

        if (!repartidor) {
            return res.status(404).json({
                mensaje: 'Repartidor no encontrado',
            });
        }

        // Un ADMIN solo puede modificar repartidores de su sucursal.
        if (
            req.usuario.rol !== 'MASTER' &&
            repartidor.sucursalId !== req.usuario.sucursalId
        ) {
            return res.status(403).json({
                mensaje: 'No tenés permisos para modificar este repartidor',
            });
        }

        const { nombre, apellido, email, password, sucursalId } = req.body;

        const emailNormalizado = email?.trim().toLowerCase() ?? repartidor.email;

        // Comprobamos que el email no pertenezca a otro repartidor.
        const repartidorConEseEmail = await Repartidor.findOne({
            where: { email: emailNormalizado },
        });

        if (
            repartidorConEseEmail &&
            repartidorConEseEmail.id !== repartidor.id
        ) {
            return res.status(409).json({
                code: 'email-en-uso',
            });
        }

        const datosActualizados = {
            nombre: nombre?.trim() ?? repartidor.nombre,
            apellido: apellido?.trim() ?? repartidor.apellido,
            email: emailNormalizado,
        };

        // Solo MASTER puede cambiar la sucursal.
        if (sucursalId !== undefined) {
            if (req.usuario.rol !== 'MASTER') {
                return res.status(403).json({
                    mensaje: 'No tenés permisos para cambiar la sucursal',
                });
            }

            const errorSucursal = await validarSucursal(sucursalId);

            if (errorSucursal) {
                return res.status(400).json({
                    code: errorSucursal,
                });
            }

            datosActualizados.sucursalId = Number(sucursalId);
        }

        // Si se envió una contraseña nueva, la encriptamos.
        if (password) {
            datosActualizados.password = await bcrypt.hash(password, 10);
        }

        await repartidor.update(datosActualizados);
        await repartidor.reload({ include: [SUCURSAL] });

        return res.status(200).json(datosDe(repartidor));

    } catch (error) {
        console.error('Error al actualizar repartidor:', error.message);

        return res.status(500).json({
            mensaje: 'Error al actualizar el repartidor',
        });
    }
};

const crearRepartidor = async (req, res) => {
    try {
        const { nombre, apellido, email, password, sucursalId } = req.body;

        const sucursalDestino = Number(sucursalId);
        
        if ( req.usuario.rol !== 'MASTER' && sucursalDestino !== req.usuario.sucursalId ) 
            {
                return res.status(403).json({
                    mensaje: 'Solo podés crear repartidores para tu sucursal'
                });
            }

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
            sucursalId: sucursalDestino
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

const desactivarRepartidor = async (req, res) => {
    try {
        const repartidor = await Repartidor.findByPk(req.params.id);

        if (!repartidor) {
            return res.status(404).json({
                mensaje: 'Repartidor no encontrado'
            });
        }

        if (
            req.usuario.rol !== 'MASTER' &&
            repartidor.sucursalId !== req.usuario.sucursalId
        ) {
            return res.status(403).json({
                mensaje: 'No tenés permisos para desactivar este repartidor'
            });
        }

        if (!repartidor.activo) {
            return res.status(400).json({
                mensaje: 'El repartidor ya está inactivo'
            });
        }

        const viajeActivo = await Viaje.findOne({
            where: {
                repartidorId: repartidor.id,
                estado: 'activo'
            }
        });

        if (viajeActivo) {
            return res.status(400).json({
                mensaje: 'No se puede desactivar un repartidor que tiene un viaje activo'
            });
        }

        await repartidor.update({ activo: false });

        return res.status(200).json({
            mensaje: 'Repartidor desactivado correctamente'
        });
    } catch (error) {
        console.error('Error al desactivar repartidor:', error);
        return res.status(500).json({
            mensaje: 'Error al desactivar el repartidor'
        });
    }
};

const reactivarRepartidor = async (req, res) => {
    try {
        const repartidor = await Repartidor.findByPk(req.params.id);

        if (!repartidor) {
            return res.status(404).json({
                mensaje: 'Repartidor no encontrado'
            });
        }

        if (
            req.usuario.rol !== 'MASTER' &&
            repartidor.sucursalId !== req.usuario.sucursalId
        ) {
            return res.status(403).json({
                mensaje: 'No tenés permisos para reactivar este repartidor'
            });
        }

        if (repartidor.activo) {
            return res.status(400).json({
                mensaje: 'El repartidor ya está activo'
            });
        }

        await repartidor.update({ activo: true });

        return res.status(200).json({
            mensaje: 'Repartidor reactivado correctamente'
        });
    } catch (error) {
        console.error('Error al reactivar repartidor:', error);
        return res.status(500).json({
            mensaje: 'Error al reactivar el repartidor'
        });
    }
};

module.exports = {
    verRepartidores,
    crearRepartidor,
    obtenerRepartidorPorId,
    actualizarRepartidor,
    desactivarRepartidor,
    reactivarRepartidor
};
