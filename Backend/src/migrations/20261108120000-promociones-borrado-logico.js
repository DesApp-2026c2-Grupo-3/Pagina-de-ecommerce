'use strict';

// Borrado lógico de promociones: "eliminar" completa deletedAt en vez de borrar la fila.
// Así los pedidos viejos (DetallePedidos.promocionId) y los reportes de promociones la siguen encontrando.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Promociones', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Promociones', 'deletedAt');
  },
};