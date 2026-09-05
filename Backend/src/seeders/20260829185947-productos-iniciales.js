'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Productos', [
      {
        nombre: 'Hamburguesa Abominacion',
        descripcion: 'Hamburguesa con carne, queso, lechuga, aros de cebolla y mas mierdas...',
        precio: 4500.00,
        imagen: '/imagenes/hamburguesa-abominacion.jpg',
        disponible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Papas Fritas',
        descripcion: 'Papas fritas clásicas',
        precio: 2000.00,
        imagen: '/imagenes/papas-fritas.jpg',
        disponible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Nuggets',
        descripcion: 'Nuggets de pollo',
        precio: 3000.00,
        imagen: '/imagenes/nuggets-pollo.jpg',
        disponible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Pizza',
        descripcion: 'Pizza pepperoni',
        precio: 1800.00,
        imagen: '/imagenes/pizza-pepperoni.avif',
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