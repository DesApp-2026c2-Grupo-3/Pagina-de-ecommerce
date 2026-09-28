'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StockSucursals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      sucursalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Sucursals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cantidad: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
      },
      stockMinimo: {
        type: Sequelize.DECIMAL,
        allowNull: true
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
    await queryInterface.addConstraint('StockSucursals', {
      fields: ['insumoId', 'sucursalId'],
      type: 'unique',
      name: 'stock_sucursal_insumo_sucursal_unique'
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('StockSucursals');
  }
};
