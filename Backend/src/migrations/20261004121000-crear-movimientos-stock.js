'use strict';

// Historial de cambios del stock: cada aumento y cada baja, con su motivo y quién la hizo
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MovimientoStocks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      sucursalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Sucursals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      insumoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Insumos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // 'aumento' o 'baja'
      tipo: { type: Sequelize.STRING, allowNull: false },
      cantidad: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
      cantidadAnterior: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
      cantidadNueva: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
      // Solo bajas: merma, vencimiento, rotura, faltante, correccion, otro
      motivo: { type: Sequelize.STRING, allowNull: true },
      detalle: { type: Sequelize.STRING(200), allowNull: true },
      // Quién lo hizo (queda vacío si después se borra ese admin)
      adminId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('MovimientoStocks');
  },
};