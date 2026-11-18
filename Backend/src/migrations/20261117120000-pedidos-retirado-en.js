'use strict';

// D-07: el retiro del pedido en el local se registra aparte del estado.
// Retirar no cambia el estado ("Listo para retirar"); el pedido pasa a "En camino"
// recién cuando el repartidor inicia el viaje, y así lo ve el cliente.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Pedidos', 'retiradoEn', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Pedidos', 'retiradoEn');
  },
};
