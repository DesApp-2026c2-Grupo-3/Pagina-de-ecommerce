'use strict';

const TABLA = 'Productos';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Solo bebidas: cola, naranja, lima, agua
      await queryInterface.addColumn(TABLA, 'sabor', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      // Papas y bebidas: regular, mediano, grande
      await queryInterface.addColumn(TABLA, 'tamanio', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(TABLA, 'tamanio', { transaction });
      await queryInterface.removeColumn(TABLA, 'sabor', { transaction });
    });
  },
};