'use strict';

// ⚠️ Verificá en pgAdmin el nombre real de la tabla.
// Sequelize pluraliza "Direccion" como "Direccions" por defecto,
// pero si en tu migración original le pusiste otro nombre, cambialo acá.
const TABLA = 'Direccions';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(TABLA, 'ciudad', 'localidad', { transaction });

      await queryInterface.addColumn(TABLA, 'provincia', {
        type: Sequelize.STRING,
      }, { transaction });

      await queryInterface.addColumn(TABLA, 'entreCalles', {
        type: Sequelize.STRING,
      }, { transaction });

      await queryInterface.addColumn(TABLA, 'observaciones', {
        type: Sequelize.STRING(140),
      }, { transaction });

      // DECIMAL(10, 7): precisión de centímetros, sin errores de redondeo
      await queryInterface.addColumn(TABLA, 'latitud', {
        type: Sequelize.DECIMAL(10, 7),
      }, { transaction });

      await queryInterface.addColumn(TABLA, 'longitud', {
        type: Sequelize.DECIMAL(10, 7),
      }, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(TABLA, 'longitud', { transaction });
      await queryInterface.removeColumn(TABLA, 'latitud', { transaction });
      await queryInterface.removeColumn(TABLA, 'observaciones', { transaction });
      await queryInterface.removeColumn(TABLA, 'entreCalles', { transaction });
      await queryInterface.removeColumn(TABLA, 'provincia', { transaction });
      await queryInterface.renameColumn(TABLA, 'localidad', 'ciudad', { transaction });
    });
  },
};
