    'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const ahora = new Date();

    const [sucursales] = await queryInterface.sequelize.query(
      `SELECT id FROM "Sucursals"`
    );
    const [insumos] = await queryInterface.sequelize.query(
      `SELECT id, nombre, "unidadMedida" FROM "Insumos"`
    );

    // Stock inicial y mínimo por insumo, según su unidad de medida.
    // Mismo valor para las 8 sucursales por convención (ver notas del sprint).
    const stockPorUnidad = {
      unidad: { cantidad: 200, minimo: 40 },
      hoja: { cantidad: 400, minimo: 80 },
      rodaja: { cantidad: 400, minimo: 80 },
      aro: { cantidad: 400, minimo: 80 },
      tira: { cantidad: 250, minimo: 50 },
      cucharada: { cantidad: 300, minimo: 60 },
      porción: { cantidad: 150, minimo: 30 },
    };

    const filas = [];
    for (const sucursal of sucursales) {
      for (const insumo of insumos) {
        const cfg = stockPorUnidad[insumo.unidadMedida] ?? { cantidad: 100, minimo: 20 };
        filas.push({
          insumoId: insumo.id,
          sucursalId: sucursal.id,
          cantidad: cfg.cantidad,
          stockMinimo: cfg.minimo,
          createdAt: ahora,
          updatedAt: ahora,
        });
      }
    }

    await queryInterface.bulkInsert('StockSucursals', filas);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('StockSucursals', null, {});
  },
};