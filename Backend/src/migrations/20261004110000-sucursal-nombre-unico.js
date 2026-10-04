'use strict';

// Una sucursal no puede repetir su nombre (evita duplicados aunque un seeder se corra dos veces)
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('Sucursals', {
      fields: ['nombre'],
      type: 'unique',
      name: 'sucursal_nombre_unico',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('Sucursals', 'sucursal_nombre_unico');
  },
};