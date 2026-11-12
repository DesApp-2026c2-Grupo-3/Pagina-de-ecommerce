
const bcrypt = require('bcrypt');
const { Repartidor, Sucursal } = require('../../models');

const incluirSucursal = {
    model: Sucursal,
    attributes: ['id', 'nombre']
};

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
                'createdAt'
            ],
            include: [incluirSucursal],
            order: [['nombre', 'ASC']]
        });

        return res.status(200).json(repartidores);
    } catch (error) {
        console.error('Error al obtener repartidores:', error);
        return res.status(500).json({
            mensaje: 'Error al obtener los repartidores'
        });
    }
};

const crearRepartidor = async (req, res) => {
    try {
        const { nombre, apellido, email, password, sucursalId } = req.body;

        const sucursalDestino = Number(sucursalId);
        
        if (req.usuario.rol !== 'MASTER' &&
            sucursalDestino !== req.usuario.sucursalId) 
            {
                return res.status(403).json({
                    mensaje: 'Solo podés crear repartidores para tu sucursal'
                });
            }

        const sucursal = await Sucursal.findByPk(sucursalId);

        if (!sucursal || !sucursal.activa) {
            return res.status(400).json({
                code: 'La sucursal elegida no existe o está inactiva'
            });
        }

        const existente = await Repartidor.findOne({
            where: { email }
        });

        if (existente) {
            return res.status(409).json({
                code: 'email-en-uso'
            });
        }

        const passwordEncriptada = await bcrypt.hash(password, 10);

        const repartidor = await Repartidor.create({
            nombre,
            apellido,
            email,
            password: passwordEncriptada,
            sucursalId: sucursalDestino
        });

        const resultado = await Repartidor.findByPk(repartidor.id, {
            attributes: [
                'id',
                'nombre',
                'apellido',
                'email',
                'sucursalId',
                'activo',
                'createdAt'
            ],
            include: [incluirSucursal]
        });

        return res.status(201).json(resultado);
    } catch (error) {
        console.error('Error al crear repartidor:', error);
        return res.status(500).json({
            mensaje: 'Error al crear el repartidor'
        });
    }
};

module.exports = {
    verRepartidores,
    crearRepartidor
};
