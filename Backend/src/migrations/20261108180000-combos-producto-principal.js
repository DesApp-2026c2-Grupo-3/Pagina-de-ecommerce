'use strict';

// Un combo no tiene receta propia: usa la de su producto principal (ej: Combo Fast Cheese → Fast Cheese)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Productos', 'productoPrincipalId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Productos', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Productos', 'productoPrincipalId');
  },
};