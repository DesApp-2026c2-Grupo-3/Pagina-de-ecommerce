'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Si la columna ya existe (base armada a mano) no hace nada
    const tabla = await queryInterface.describeTable('Sucursals');
    if (!tabla.encargadoEditaHorario) {
      // Por defecto todas las sucursales dejan que su encargado edite el horario
      await queryInterface.addColumn('Sucursals', 'encargadoEditaHorario', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },

  async down(queryInterface) {
    const tabla = await queryInterface.describeTable('Sucursals');
    if (tabla.encargadoEditaHorario) {
      await queryInterface.removeColumn('Sucursals', 'encargadoEditaHorario');
    }
  },
};
