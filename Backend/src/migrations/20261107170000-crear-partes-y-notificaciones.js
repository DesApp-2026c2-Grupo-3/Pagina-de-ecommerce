'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Si las tablas ya existen (base armada a mano) no se vuelven a crear
    const tablas = await queryInterface.showAllTables();

    if (!tablas.includes('Partes')) {
      await queryInterface.createTable('Partes', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        sucursalId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'Sucursals', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
        },
        creadoPorId: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: 'Admins', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
        },
        tipo: { type: Sequelize.STRING(10), allowNull: false },
        descripcion: { type: Sequelize.STRING(300), allowNull: false },
        urgencia: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'NORMAL' },
        productoIds: { type: Sequelize.JSONB, allowNull: true },
        pedidoId: { type: Sequelize.INTEGER, allowNull: true }, // sin FK: es solo una referencia para el encargado
        estado: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'ENVIADO' },
        vistoPorId: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: 'Admins', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
        },
        vistoEn: { type: Sequelize.DATE, allowNull: true },
        resueltoPorId: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: 'Admins', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
        },
        resueltoEn: { type: Sequelize.DATE, allowNull: true },
        nota: { type: Sequelize.STRING(200), allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
      await queryInterface.addIndex('Partes', ['sucursalId', 'estado'], { name: 'partes_sucursal_estado' });
    }

    if (!tablas.includes('Notificaciones')) {
      await queryInterface.createTable('Notificaciones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        destinatarioId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'Admins', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
        },
        tipo: { type: Sequelize.STRING(20), allowNull: false },
        titulo: { type: Sequelize.STRING(120), allowNull: false },
        mensaje: { type: Sequelize.STRING(300), allowNull: false },
        parteId: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: 'Partes', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
        },
        leidaEn: { type: Sequelize.DATE, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
      // Para contar y listar las no leídas de cada administrador
      await queryInterface.addIndex('Notificaciones', ['destinatarioId', 'leidaEn'], { name: 'notificaciones_destinatario_leida' });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Notificaciones');
    await queryInterface.dropTable('Partes');
  },
};
