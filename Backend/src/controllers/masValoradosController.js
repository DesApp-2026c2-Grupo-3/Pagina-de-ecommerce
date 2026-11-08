const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const { MIN_CALIFICACIONES_RANKING } = require('../config/calificaciones');

const LIMITE_POR_DEFECTO = 4;
const LIMITE_MAXIMO = 12;

// GET /productos/mas-valorados?sucursalId=2&limite=4
// Ranking de productos por el promedio de sus estrellas (sin los complementos, como las salsas, y sin los comentarios
// que no tienen estrellas). Con sucursalId, solo las calificaciones de los pedidos de esa sucursal.
// Responde: [{ productoId: 12, promedio: 4.8, cantidad: 9 }, ...] de mayor a menor promedio (a igual promedio, más calificaciones)
const obtenerMasValorados = async (req, res) => {
    try {
        const sucursalId = req.query.sucursalId !== undefined ? Number(req.query.sucursalId) : null;
        if (sucursalId !== null && (!Number.isInteger(sucursalId) || sucursalId <= 0)) {
            return res.status(400).json({ mensaje: 'La sucursal no es válida' });
        }

        const pedido = Number(req.query.limite);
        const limite = Number.isInteger(pedido) && pedido > 0 ? Math.min(pedido, LIMITE_MAXIMO) : LIMITE_POR_DEFECTO;

        const filas = await sequelize.query(
            `SELECT c."productoId", COUNT(c.puntaje)::int AS cantidad, ROUND(AVG(c.puntaje)::numeric, 2) AS promedio
             FROM "Calificaciones" c
             JOIN "Productos" p ON p.id = c."productoId" AND p."deletedAt" IS NULL
             JOIN "Categoria" cat ON cat.id = p."categoriaId" AND cat."esComplemento" = false
             WHERE c.puntaje IS NOT NULL ${sucursalId ? 'AND c."sucursalId" = :sucursalId' : ''}
             GROUP BY c."productoId"
             HAVING COUNT(c.puntaje) >= :minimo
             ORDER BY promedio DESC, cantidad DESC, c."productoId" ASC
             LIMIT :limite`,
            { replacements: { sucursalId, minimo: MIN_CALIFICACIONES_RANKING, limite }, type: QueryTypes.SELECT }
        );

        res.json(filas.map((f) => ({ productoId: f.productoId, promedio: Number(f.promedio), cantidad: Number(f.cantidad) })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los productos más valorados' });
    }
};

module.exports = { obtenerMasValorados };
