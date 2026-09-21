'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin1234', 10);

    await queryInterface.bulkInsert('Admins', [{
      nombre: 'Admin-Master',
      email: 'admin@master.com',
      password: 123456,
      rol: 'MASTER',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Admins', { email: 'admin@master.com' }, {});
  }
};