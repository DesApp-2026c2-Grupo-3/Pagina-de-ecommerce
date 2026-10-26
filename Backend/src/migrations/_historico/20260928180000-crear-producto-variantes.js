'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Tamaños de un producto, cada uno con su precio (ej: papas regular / mediana / grande)
      await queryInterface.createTable('ProductoVariantes', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        productoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Productos', key: 'id' },
          onDelete: 'CASCADE',
        },
        tamanio: { type: Sequelize.STRING, allowNull: false },
        precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        // Texto opcional para mostrar, ej: "354 ml"
        etiqueta: { type: Sequelize.STRING, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // Un producto no puede tener dos veces el mismo tamaño
      await queryInterface.addConstraint('ProductoVariantes', {
        fields: ['productoId', 'tamanio'],
        type: 'unique',
        name: 'producto_variante_unica',
        transaction,
      });

      // Cada línea de un pedido guarda qué tamaño se pidió
      await queryInterface.addColumn('DetallePedidos', 'tamanio', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      // El tamaño ya no es del producto: ahora vive en sus variantes
      await queryInterface.removeColumn('Productos', 'tamanio', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Productos', 'tamanio', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
      await queryInterface.removeColumn('DetallePedidos', 'tamanio', { transaction });
      await queryInterface.dropTable('ProductoVariantes', { transaction });
    });
  },
};