'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Si la columna ya existe (base armada a mano) no hace nada
    const tabla = await queryInterface.describeTable('Sucursals');
    if (!tabla.maxEmpleados) {
      await queryInterface.addColumn('Sucursals', 'maxEmpleados', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
      });
    }
  },

  async down(queryInterface) {
    const tabla = await queryInterface.describeTable('Sucursals');
    if (tabla.maxEmpleados) {
      await queryInterface.removeColumn('Sucursals', 'maxEmpleados');
    }
  },
};
