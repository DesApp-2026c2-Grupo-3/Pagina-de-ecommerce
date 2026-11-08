'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Si la tabla ya existe (base armada a mano) no hace nada
    const tablas = await queryInterface.showAllTables();
    if (tablas.includes('CierresSucursales')) return;

    await queryInterface.createTable('CierresSucursales', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      sucursalId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Sucursals', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      motivo: { type: Sequelize.STRING(200), allowNull: false },
      cerradoPorId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Admins', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      reabiertoPorId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Admins', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      reabiertoEn: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('CierresSucursales', ['sucursalId', 'reabiertoEn'], { name: 'cierres_sucursal_activo' });
    // Una sucursal no puede tener dos cierres activos a la vez
    await queryInterface.addIndex('CierresSucursales', ['sucursalId'], {
      name: 'cierre_activo_unico',
      unique: true,
      where: { reabiertoEn: null },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CierresSucursales');
  },
};
