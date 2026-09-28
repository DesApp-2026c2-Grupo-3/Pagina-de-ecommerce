'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const ahora = new Date();

    const insumos = [
      { nombre: 'Pan de hamburguesa', unidadMedida: 'unidad' },
      { nombre: 'Medallón de carne (vacuno)', unidadMedida: 'unidad' },
      { nombre: 'Queso (feta)', unidadMedida: 'feta' },
      { nombre: 'Lechuga', unidadMedida: 'hoja' },
      { nombre: 'Tomate', unidadMedida: 'rodaja' },
      { nombre: 'Cebolla', unidadMedida: 'aro' },
      { nombre: 'Panceta (bacon)', unidadMedida: 'tira' },
      { nombre: 'Pepino', unidadMedida: 'rodaja' },
      { nombre: 'Salsa especial de la casa', unidadMedida: 'cucharada' },
      { nombre: 'Papas fritas', unidadMedida: 'porción' },
      { nombre: 'Pechuga de pollo', unidadMedida: 'unidad' },
      { nombre: 'Palito de muzzarella', unidadMedida: 'unidad' },
      { nombre: 'Nugget de pollo', unidadMedida: 'unidad' },
      { nombre: 'Mini pizza individual', unidadMedida: 'unidad' },
      { nombre: 'Coca-Cola 500ml', unidadMedida: 'unidad' },
      { nombre: 'Limonada preparada', unidadMedida: 'porción' },
    ];

    await queryInterface.bulkInsert(
      'Insumos',
      insumos.map((i) => ({
        ...i,
        precioComercial: null,
        createdAt: ahora,
        updatedAt: ahora,
      }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Insumos', null, {});
  },
};