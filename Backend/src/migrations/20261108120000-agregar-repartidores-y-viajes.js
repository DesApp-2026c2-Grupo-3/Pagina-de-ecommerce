'use strict';

// Módulo de reparto: Repartidors, Viajes y Pedidos.viajeId.
// El esquema inicial ya los crea en las bases nuevas, pero se agregaron después de que muchas bases
// lo habían aplicado (y esa migración no se vuelve a correr). Esta los agrega a esas bases.
// Es idempotente: lo que ya existe no se toca.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const timestamps = {
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    };
    const id = { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false };
    const tablas = await queryInterface.showAllTables();

    await queryInterface.sequelize.transaction(async (transaction) => {
      if (!tablas.includes('Repartidors')) {
        await queryInterface.createTable('Repartidors', {
          id,
          nombre: { type: Sequelize.STRING, allowNull: false },
          apellido: { type: Sequelize.STRING, allowNull: false },
          email: { type: Sequelize.STRING, allowNull: false, unique: true },
          password: { type: Sequelize.STRING, allowNull: false },
          sucursalId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Sucursals', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },
          activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          ...timestamps,
        }, { transaction });
      }

      if (!tablas.includes('Viajes')) {
        await queryInterface.createTable('Viajes', {
          id,
          repartidorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Repartidors', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },
          fechaInicio: { type: Sequelize.DATE, allowNull: true, defaultValue: Sequelize.NOW },
          fechaFin: { type: Sequelize.DATE, allowNull: true },
          estado: { type: Sequelize.STRING, allowNull: false, defaultValue: 'preparando' },
          motivoAsistencia: { type: Sequelize.STRING, allowNull: true },
          comentarioAsistencia: { type: Sequelize.TEXT, allowNull: true },
          fechaSolicitudAsistencia: { type: Sequelize.DATE, allowNull: true },
          latitudAsistencia: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
          longitudAsistencia: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
          ...timestamps,
        }, { transaction });

        // La base impide que un repartidor tenga dos viajes activos a la vez, aunque lleguen dos pedidos simultáneos
        await queryInterface.addIndex('Viajes', ['repartidorId'], {
          name: 'viaje_en_curso_por_repartidor_unico',
          unique: true,
          where: { estado: { [Sequelize.Op.in]: ['activo', 'requiere asistencia'] } },
          transaction,
        });
      }

      const pedidos = await queryInterface.describeTable('Pedidos');
      if (!pedidos.viajeId) {
        await queryInterface.addColumn('Pedidos', 'viajeId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Viajes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        }, { transaction });
      }
    });
  },

  async down(queryInterface) {
    const tablas = await queryInterface.showAllTables();
    const pedidos = await queryInterface.describeTable('Pedidos');
    if (pedidos.viajeId) await queryInterface.removeColumn('Pedidos', 'viajeId');
    if (tablas.includes('Viajes')) await queryInterface.dropTable('Viajes');
    if (tablas.includes('Repartidors')) await queryInterface.dropTable('Repartidors');
  },
};
