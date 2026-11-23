'use strict';

// Calificaciones de los clientes: una por pedido entregado, con puntaje de 1 a 5 y comentario opcional.
// sucursalId se copia del pedido para poder filtrar y promediar por sucursal sin armar joins.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('Calificaciones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        pedidoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true, // una sola calificación por pedido
          references: { model: 'Pedidos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        usuarioId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        sucursalId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Sucursals', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        puntaje: { type: Sequelize.INTEGER, allowNull: false },
        comentario: { type: Sequelize.STRING(300), allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addConstraint('Calificaciones', {
        fields: ['puntaje'],
        type: 'check',
        name: 'calificacion_puntaje_entre_1_y_5',
        where: { puntaje: { [Sequelize.Op.between]: [1, 5] } },
        transaction,
      });
      await queryInterface.addIndex('Calificaciones', ['sucursalId'], { transaction });
      await queryInterface.addIndex('Calificaciones', ['createdAt'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Calificaciones');
  },
};
