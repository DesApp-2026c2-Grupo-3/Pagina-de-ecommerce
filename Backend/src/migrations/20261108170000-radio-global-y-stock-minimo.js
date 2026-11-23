'use strict';

// - El radio de entrega deja de ser de cada sucursal: ahora es uno solo, en Parametros.
// - Cada insumo tiene un stock mínimo sugerido: al crearlo (o al crear una sucursal) se copia
//   como mínimo inicial a todas las sucursales. Cada sucursal lo puede ajustar después.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Sucursals', 'radioEntregaKm', { transaction });
      await queryInterface.addColumn('Insumos', 'stockMinimo', {
        type: Sequelize.DECIMAL,
        allowNull: true,
      }, { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Insumos', 'stockMinimo');
    await queryInterface.addColumn('Sucursals', 'radioEntregaKm', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5,
    });
  },
};