'use strict';

// Las imágenes de los productos pasan a Cloudinary:
//  - Productos.imagen guarda la URL completa de Cloudinary (la tienda la usa tal cual).
//  - Productos.imagenPublicId guarda el identificador en Cloudinary, para poder reemplazarla o borrarla.
// Mientras un producto tenga una ruta local (/imagenes/...), imagenPublicId queda vacío.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Productos', 'imagenPublicId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Productos', 'imagenPublicId');
  },
};