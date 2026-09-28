'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RecetaInsumos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      productoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Productos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      insumoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Insumos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cantidadBase: {
        type: Sequelize.DECIMAL,
        allowNull: false
      },
      esRemovible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      esAgregable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addConstraint('RecetaInsumos', {
      fields: ['productoId', 'insumoId'],
      type: 'unique',
      name: 'receta_insumo_producto_insumo_unique'
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('RecetaInsumos');
  }
};
