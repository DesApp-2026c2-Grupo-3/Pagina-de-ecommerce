'use strict';

// Guarda en cada línea del pedido si se pidió con una promoción:
//  - promocionId: qué promo se usó (vacío si la línea no tenía promo).
//  - precioLista: el precio unitario sin descuento, para saber cuánto ahorró el cliente
//    (con "Gratis" el precio queda en 0 y no se puede deducir el original).
// Los pedidos anteriores a esta migración quedan sin promo.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('DetallePedidos', 'promocionId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Promociones', key: 'id' },
        onUpdate: 'CASCADE',
        // Si se borra la promo, el pedido queda igual pero sin la referencia
        onDelete: 'SET NULL',
      }, { transaction });

      await queryInterface.addColumn('DetallePedidos', 'precioLista', {
        type: Sequelize.DECIMAL,
        allowNull: true,
      }, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('DetallePedidos', 'precioLista', { transaction });
      await queryInterface.removeColumn('DetallePedidos', 'promocionId', { transaction });
    });
  },
};