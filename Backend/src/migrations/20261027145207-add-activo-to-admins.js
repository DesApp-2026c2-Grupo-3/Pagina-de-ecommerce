'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
     async up(queryInterface, Sequelize) {
     const tabla = await queryInterface.describeTable('Admins');
     if (!tabla.activo) {
       await queryInterface.addColumn('Admins', 'activo', {
         type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true,
       });
     }
   },
   async down(queryInterface) {
     const tabla = await queryInterface.describeTable('Admins');
     if (tabla.activo) await queryInterface.removeColumn('Admins', 'activo');
   },
};
