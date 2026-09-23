'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const categorias = [
      'Hamburguesa',
      'Combos',
      'Papas Fritas',
      'Nuggets',
      'Bebidas',
      'Postres',
      'Ensaladas',
      'Sin TACC',
      'Desayunos y Meriendas',
      'Menú Café',
      'Salsas'
    ];

    const ahora = new Date();

    const registros = categorias.map((nombre) => ({
      nombre,
      createdAt: ahora,
      updatedAt: ahora
    }));

    await queryInterface.bulkInsert('Categoria', registros, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Categoria', null, {});
  }
};