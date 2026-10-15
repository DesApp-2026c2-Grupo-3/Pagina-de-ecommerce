const { Pedido, DetallePedido, Producto, Admin, sequelize } = require('../../models');
const { Op } = require('sequelize');

const obtenerProductosMasVendidos = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const wherePedido = {
            estado: { [Op.iLike]: 'entregado' },
        };

        // El administrador de sucursal solo puede consultar la suya.
        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({ mensaje: 'La sucursal no es válida' });
            }

            wherePedido.sucursalId = sucursalId;
        }

        const productos = await DetallePedido.findAll({
            attributes: [
                'productoId',
                [sequelize.fn('SUM', sequelize.col('DetallePedido.cantidad')), 'unidadesVendidas'],
            ],
            include: [
                {
                    model: Pedido,
                    attributes: [],
                    where: wherePedido,
                    required: true,
                },
                {
                    model: Producto,
                    attributes: ['nombre', 'imagen'],
                    paranoid: false,
                    required: true,
                },
            ],
            group: [
                'DetallePedido.productoId',
                'Producto.id',
            ],
            order: [[sequelize.literal('"unidadesVendidas"'), 'DESC']],
        });

        return res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos más vendidos:', error);
        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de productos más vendidos',
        });
    }
};

const obtenerProductosMenosVendidos = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        const wherePedido = {
            estado: { [Op.iLike]: 'entregado' },
        };

        // Un administrador común solo consulta su sucursal.
        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({
                    mensaje: 'La sucursal no es válida',
                });
            }

            wherePedido.sucursalId = sucursalId;
        }

        const productos = await Producto.findAll({
            attributes: [
                'id',
                'nombre',
                'imagen',
                [
                    sequelize.fn(
                        'COALESCE',
                        sequelize.fn(
                            'SUM',
                            sequelize.col('DetallePedidos.cantidad'),
                        ),
                        0,
                    ),
                    'unidadesVendidas',
                ],
            ],
            include: [
                {
                    model: DetallePedido,
                    attributes: [],
                    required: false,
                    include: [
                        {
                            model: Pedido,
                            attributes: [],
                            where: wherePedido,
                            required: true,
                        },
                    ],
                },
            ],
            group: ['Producto.id'],
            order: [
                [sequelize.literal('"unidadesVendidas"'), 'ASC'],
                ['nombre', 'ASC'],
            ],
        });

        return res.json(
            productos.map((producto) => ({
                productoId: producto.id,
                nombre: producto.nombre,
                imagen: producto.imagen,
                unidadesVendidas: producto.get('unidadesVendidas'),
            })),
        );
    } catch (error) {
        console.error('Error al obtener productos menos vendidos:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de productos menos vendidos',
        });
    }
};



const obtenerProductosMayorFacturacion = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        const wherePedido = {
            estado: { [Op.iLike]: 'entregado' },
        };

        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({
                    mensaje: 'La sucursal no es válida',
                });
            }

            wherePedido.sucursalId = sucursalId;
        }

        const productos = await DetallePedido.findAll({
            attributes: [
                'productoId',
                [
                    sequelize.literal(
                        'SUM("DetallePedido"."cantidad" * "DetallePedido"."precio")',
                    ),
                    'facturacion',
                ],
            ],
            include: [
                {
                    model: Pedido,
                    attributes: [],
                    where: wherePedido,
                    required: true,
                },
                {
                    model: Producto,
                    attributes: ['nombre', 'imagen'],
                    paranoid: false,
                    required: true,
                },
            ],
            group: ['DetallePedido.productoId', 'Producto.id'],
            order: [
                [sequelize.literal('"facturacion"'), 'DESC'],
            ],
        });

        return res.json(
            productos.map((producto) => ({
                productoId: producto.productoId,
                nombre: producto.Producto.nombre,
                imagen: producto.Producto.imagen,
                facturacion: producto.get('facturacion'),
            })),
        );
    } catch (error) {
        console.error('Error al obtener productos con mayor facturación:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de facturación',
        });
    }
};

module.exports = {
    obtenerProductosMasVendidos, obtenerProductosMenosVendidos, obtenerProductosMayorFacturacion
};