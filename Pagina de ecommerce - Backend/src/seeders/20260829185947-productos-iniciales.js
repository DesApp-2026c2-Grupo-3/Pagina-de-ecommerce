'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Productos', [
      {
        nombre: 'Hamburguesa Clásica',
        descripcion: 'Hamburguesa con carne, queso, lechuga y tomate',
        precio: 4500.00,
        imagen: 'hamburguesa-clasica.jpg',
        disponible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Papas Fritas',
        descripcion: 'Papas fritas clásicas',
        precio: 2000.00,
        imagen: 'papas.jpg',
        disponible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Nuggets',
        descripcion: 'Nuggets de pollo',
        precio: 3000.00,
        imagen: 'nuggets.jpg',
        disponible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Gaseosa',
        descripcion: 'Gaseosa 500ml',
        precio: 1800.00,
        imagen: 'gaseosa.jpg',
        disponible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Productos', null, {});
  }
};