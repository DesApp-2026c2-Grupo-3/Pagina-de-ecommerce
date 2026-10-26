'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // La sucursal que gestiona cada admin (vacía para el MASTER)
    await queryInterface.addColumn('Admins', 'sucursalId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Sucursals', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Admins', 'sucursalId');
  },
};