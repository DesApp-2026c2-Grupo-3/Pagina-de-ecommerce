'use strict';

// Cada pedido guarda:
//  - costoEnvio: lo que se cobró de envío. Va APARTE de "total" (que sigue siendo solo productos),
//    así los reportes de facturación de productos no cambian.
//  - minutosEstimados: el tiempo de entrega que se le prometió al cliente al hacer el pedido.
//    Comparado con el tiempo real (línea de tiempo), sirve para medir las demoras.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Pedidos', 'costoEnvio', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      }, { transaction });
      await queryInterface.addColumn('Pedidos', 'minutosEstimados', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Pedidos', 'minutosEstimados');
    await queryInterface.removeColumn('Pedidos', 'costoEnvio');
  },
};