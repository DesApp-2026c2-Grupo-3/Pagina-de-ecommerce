'use strict';

// Carga las promociones que antes estaban fijas en config/promociones.js (los datos están en
// ./datos/promociones-iniciales.json, con los productos referenciados por NOMBRE): el producto de la
// semana, el regalo y las 3 promos de cada día. Desde acá en más las arma el Admin-Master desde el panel.
//
// Se corre DESPUÉS de la migración 20261030120000-crear-promociones y de las semillas del catálogo
// (necesita que existan los productos). Es re-ejecutable: si ya hay promociones no hace nada, así que
// no pisa lo que el master haya cambiado. Una promo con un producto que no existe se saltea (y se avisa).

const PROMOS = require('./datos/promociones-iniciales.json');

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      const q = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, transaction }))[0];

      const [{ total }] = await q('SELECT COUNT(*)::int AS total FROM "Promociones"');
      if (total > 0) return;

      const nombres = [...new Set(PROMOS.flatMap((p) => p.items.map((i) => i.nombre)))];
      const productos = await q(
        'SELECT id, nombre FROM "Productos" WHERE "deletedAt" IS NULL AND nombre IN (:nombres)',
        { nombres }
      );
      const idPorNombre = new Map(productos.map((p) => [p.nombre, p.id]));

      for (const promo of PROMOS) {
        const faltantes = promo.items.filter((i) => !idPorNombre.has(i.nombre)).map((i) => i.nombre);
        if (faltantes.length > 0) {
          console.warn(`Promo "${promo.titulo}" salteada: no existe el producto ${faltantes.join(', ')}`);
          continue;
        }

        const [{ id }] = await q(
          `INSERT INTO "Promociones" (tipo, titulo, destacado, detalle, dias, "maxPorPedido", "compraMinima", activo, "createdAt", "updatedAt")
           VALUES (:tipo, :titulo, :destacado, :detalle, :dias, :maxPorPedido, :compraMinima, true, NOW(), NOW())
           RETURNING id`,
          {
            tipo: promo.tipo,
            titulo: promo.titulo,
            destacado: promo.destacado,
            detalle: promo.detalle,
            // Literal de array de Postgres ("{1,2}"); sin días (producto y regalo de la semana) queda en NULL
            dias: promo.dias ? `{${promo.dias.join(',')}}` : null,
            maxPorPedido: promo.maxPorPedido ?? null,
            compraMinima: promo.compraMinima ?? null,
          }
        );

        await queryInterface.bulkInsert(
          'PromocionItems',
          promo.items.map((item, indice) => ({
            promocionId: id,
            productoId: idPorNombre.get(item.nombre),
            cantidad: item.cantidad,
            descuento: item.descuento,
            orden: indice + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          { transaction }
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM "PromocionItems"');
    await queryInterface.sequelize.query('DELETE FROM "Promociones"');
  },
};
