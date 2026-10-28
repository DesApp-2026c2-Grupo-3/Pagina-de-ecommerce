'use strict';

// Cada movimiento de stock puede venir de un pedido (venta o devolución por cancelación)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('MovimientoStocks', 'pedidoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Pedidos', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('MovimientoStocks', 'pedidoId');
  },
};