'use strict';

// Parámetros del negocio editables desde el admin (antes estaban escritos en el código).
// La tabla tiene UNA sola fila (id = 1): una columna por parámetro, cada una con su tipo.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('Parametros', {
        id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, defaultValue: 1 },

        // Pedidos
        maxPedidosEnCurso: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 2 },

        // Entrega
        radioEntregaKm: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 10 },
        envioBase: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 1200 },
        envioPorKm: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 300 },

        // Tiempos (en minutos)
        preparacionBaseMin: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
        preparacionPorProductoMin: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 2 },
        viajeMinPorKm: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 4 },
        margenDemoraMin: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },

        // Calificaciones
        diasParaCalificar: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 7 },
        opinionesEnInicio: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 6 },

        // Promociones
        maxPromosPorDia: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },

        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // La única fila, con los valores por defecto
      await queryInterface.sequelize.query(
        'INSERT INTO "Parametros" (id, "createdAt", "updatedAt") VALUES (1, NOW(), NOW())',
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Parametros');
  },
};