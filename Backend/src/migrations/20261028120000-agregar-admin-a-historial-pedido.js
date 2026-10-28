'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Si la columna ya existe (base armada a mano) no hace nada
    const tabla = await queryInterface.describeTable('historialDeTiemposPedido');
    if (!tabla.adminId) {
      await queryInterface.addColumn('historialDeTiemposPedido', 'adminId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const tabla = await queryInterface.describeTable('historialDeTiemposPedido');
    if (tabla.adminId) {
      await queryInterface.removeColumn('historialDeTiemposPedido', 'adminId');
    }
  },
};
