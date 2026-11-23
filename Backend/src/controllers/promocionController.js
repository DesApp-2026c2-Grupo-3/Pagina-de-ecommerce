const { Promocion } = require('../models');
const { NOMBRES_DIAS, TIPOS_PROMO, diaDeHoy } = require('../config/promociones');
const { incluirItems, promoCompleta, aPromoPublica } = require('../utils/promociones');
const { obtenerParametros } = require('../utils/parametros');

// GET /promociones → producto de la semana, regalo, producto "nuevo en la carta" y las promos de cada día, con los productos ya resueltos (id).
// "hoy" es el día de la semana en Argentina (0 = domingo). Solo las promos activas y completas:
// una promo con un producto que ya no existe no se ofrece.
const obtenerPromociones = async (req, res) => {
    try {
        const promociones = await Promocion.findAll({
            where: { activo: true },
            include: incluirItems(),
            order: [['id', 'ASC']],
        });

        const { productoNuevoId } = await obtenerParametros();
        const ofrecidas = promociones.filter(promoCompleta).map(aPromoPublica);
        const primera = (tipo) => ofrecidas.find((p) => p.tipo === tipo) ?? null;

        res.json({
            hoy: diaDeHoy(),
            productoSemana: primera(TIPOS_PROMO.SEMANA),
            regalo: primera(TIPOS_PROMO.REGALO),
            productoNuevoId: productoNuevoId ?? null,
            dias: [1, 2, 3, 4, 5, 6, 0].map((dia) => ({
                dia,
                nombre: NOMBRES_DIAS[dia],
                promos: ofrecidas.filter((p) => p.tipo === TIPOS_PROMO.DIA && p.dias.includes(dia)),
            })),
        });
    } catch (error) {
        console.error('Error al obtener las promociones:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener las promociones' });
    }
};

module.exports = { obtenerPromociones };
