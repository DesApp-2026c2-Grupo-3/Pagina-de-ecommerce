'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Pedidos', 'direccionId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Direccions',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Pedidos', 'direccionId');
  },
};