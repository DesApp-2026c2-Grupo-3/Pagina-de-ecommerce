'use strict';

// ⚠️ El entorno se recrea desde cero: se elimina la columna horario (texto)
// y se la vuelve a crear como JSONB con estructura por día, más la zona horaria.
const TABLA = 'Sucursals';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { HORARIO_POR_DEFECTO } = require('../utils/horarioSucursal');

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(TABLA, 'zona_horaria', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'America/Argentina/Buenos_Aires',
      }, { transaction });

      await queryInterface.removeColumn(TABLA, 'horario', { transaction });

      await queryInterface.addColumn(TABLA, 'horario', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: JSON.stringify(HORARIO_POR_DEFECTO),
      }, { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(TABLA, 'horario', { transaction });

      await queryInterface.addColumn(TABLA, 'horario', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      await queryInterface.removeColumn(TABLA, 'zona_horaria', { transaction });
    });
  },
};
