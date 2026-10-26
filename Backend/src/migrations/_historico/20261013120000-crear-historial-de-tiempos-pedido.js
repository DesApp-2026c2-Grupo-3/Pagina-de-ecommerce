'use strict';

// Línea de tiempo de estados de cada pedido: un registro inmutable por transición
// (avance o retroceso). No confundir con el futuro módulo analítico de reportes.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('historialDeTiemposPedido', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      pedidoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Pedidos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      estado: { type: Sequelize.STRING, allowNull: false },
      estadoAnterior: { type: Sequelize.STRING, allowNull: true },
      fecha: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('historialDeTiemposPedido');
  },
};
