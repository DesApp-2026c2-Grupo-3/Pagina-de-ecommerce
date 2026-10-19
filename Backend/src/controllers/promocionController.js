const { Op } = require('sequelize');
const { Producto } = require('../models');
const { PRODUCTO_SEMANA, REGALO, PROMOS_DEL_DIA, TODAS, NOMBRES_DIAS, diaDeHoy } = require('../config/promociones');

// GET /promociones → producto de la semana, regalo y las promos de cada día, con los productos ya resueltos (id).
// "hoy" es el día de la semana en Argentina (0 = domingo).
const obtenerPromociones = async (req, res) => {
    try {
        const nombres = [...new Set(TODAS.flatMap((p) => p.items.map((i) => i.nombre)))];
        const productos = await Producto.findAll({
            where: { nombre: { [Op.in]: nombres } },
            attributes: ['id', 'nombre'],
        });
        const idPorNombre = new Map(productos.map((p) => [p.nombre, p.id]));

        // Una promo con un producto que ya no existe no se ofrece
        const resolver = (promo) => {
            const items = promo.items.map((i) => ({ ...i, productoId: idPorNombre.get(i.nombre) ?? null }));
            if (items.some((i) => i.productoId === null)) return null;
            const { items: _ignorados, ...resto } = promo;
            return { ...resto, items };
        };

        res.json({
            hoy: diaDeHoy(),
            productoSemana: resolver(PRODUCTO_SEMANA),
            regalo: resolver(REGALO),
            dias: [1, 2, 3, 4, 5, 6, 0].map((dia) => ({
                dia,
                nombre: NOMBRES_DIAS[dia],
                promos: PROMOS_DEL_DIA.filter((p) => p.dias.includes(dia)).map(resolver).filter(Boolean),
            })),
        });
    } catch (error) {
        console.error('Error al obtener las promociones:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener las promociones' });
    }
};

module.exports = { obtenerPromociones };
