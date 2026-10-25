'use strict';

// ⚠️ Verificá en pgAdmin el nombre real de la tabla.
// Sequelize pluraliza "Sucursal" como "Sucursals" por defecto.
const TABLA = 'Sucursals';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(TABLA, 'codigoPostal', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      // Hasta qué distancia (en línea recta) la sucursal hace delivery
      await queryInterface.addColumn(TABLA, 'radioEntregaKm', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 5,
      }, { transaction });

      // Permite "apagar" una sucursal sin borrarla (no rompe usuarios ni pedidos)
      await queryInterface.addColumn(TABLA, 'activa', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      }, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(TABLA, 'activa', { transaction });
      await queryInterface.removeColumn(TABLA, 'radioEntregaKm', { transaction });
      await queryInterface.removeColumn(TABLA, 'codigoPostal', { transaction });
    });
  },
};
