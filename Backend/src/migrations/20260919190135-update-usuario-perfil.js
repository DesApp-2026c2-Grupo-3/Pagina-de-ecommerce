'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Usuarios', 'apellido', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Usuarios', 'dni', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Usuarios', 'fechaNacimiento', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.removeColumn('Usuarios', 'direccion');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Usuarios', 'apellido');
    await queryInterface.removeColumn('Usuarios', 'dni');
    await queryInterface.removeColumn('Usuarios', 'fechaNacimiento');
    await queryInterface.addColumn('Usuarios', 'direccion', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};