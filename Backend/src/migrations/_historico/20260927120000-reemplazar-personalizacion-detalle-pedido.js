'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DetallePedidos', 'personalizaciones', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    });
    await queryInterface.removeColumn('DetallePedidos', 'ingredientesRemovidos');
    await queryInterface.removeColumn('DetallePedidos', 'ingredientesAgregados');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('DetallePedidos', 'ingredientesRemovidos', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    });
    await queryInterface.addColumn('DetallePedidos', 'ingredientesAgregados', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    });
    await queryInterface.removeColumn('DetallePedidos', 'personalizaciones');
  }
};
