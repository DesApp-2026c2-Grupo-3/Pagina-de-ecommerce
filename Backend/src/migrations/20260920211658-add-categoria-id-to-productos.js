'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Productos', 'categoriaId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Categoria',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Productos', 'categoriaId');
  }
};