'use strict';

// Borrado lógico de productos: en lugar de borrar la fila, se marca la fecha en que se eliminó
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Productos', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Productos', 'deletedAt');
  },
};