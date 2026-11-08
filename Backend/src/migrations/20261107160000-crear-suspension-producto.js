'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Si la tabla ya existe (base armada a mano) no hace nada
    const tablas = await queryInterface.showAllTables();
    if (tablas.includes('SuspensionProductos')) return;

    await queryInterface.createTable('SuspensionProductos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      productoId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Productos', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      sucursalId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Sucursals', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      origen: { type: Sequelize.STRING(10), allowNull: false },
      motivo: { type: Sequelize.STRING(200), allowNull: false },
      creadaPorId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Admins', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      rehabilitadaPorId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Admins', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      rehabilitadaEn: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Para buscar las activas de una sucursal (la consulta del catálogo)
    await queryInterface.addIndex('SuspensionProductos', ['sucursalId', 'rehabilitadaEn'], { name: 'suspension_sucursal_activa' });
    // Un mismo producto no puede tener dos suspensiones activas del mismo origen en una sucursal
    await queryInterface.addIndex('SuspensionProductos', ['productoId', 'sucursalId', 'origen'], {
      name: 'suspension_activa_unica',
      unique: true,
      where: { rehabilitadaEn: null },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('SuspensionProductos');
  },
};
