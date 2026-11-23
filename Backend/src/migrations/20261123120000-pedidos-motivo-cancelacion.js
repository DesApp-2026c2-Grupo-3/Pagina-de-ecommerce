'use strict';

// Motivo de la cancelación: lo escribe el admin al cancelar, le llega al cliente en la notificación
// y queda guardado en el pedido para el ranking de motivos de los reportes.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Pedidos', 'motivoCancelacion', {
      type: Sequelize.STRING(200),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Pedidos', 'motivoCancelacion');
  },
};
