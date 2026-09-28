'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Pedidos', 'sucursalId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Sucursals',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Pedidos', 'sucursalId');
  },
};