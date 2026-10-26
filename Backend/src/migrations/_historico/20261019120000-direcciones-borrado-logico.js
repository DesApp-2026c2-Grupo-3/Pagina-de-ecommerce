'use strict';

// Borrado lógico de direcciones: los pedidos viejos conservan la dirección de entrega
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Direccions', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Direccions', 'deletedAt');
  },
};