'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const ahora = new Date();

    const [insumos] = await queryInterface.sequelize.query(
      `SELECT id, nombre FROM "Insumos"`
    );
    const [productos] = await queryInterface.sequelize.query(
      `SELECT id, nombre FROM "Productos"`
    );

    const idInsumo = (nombre) => {
      const i = insumos.find((i) => i.nombre === nombre);
      if (!i) throw new Error(`Insumo no encontrado: ${nombre}`);
      return i.id;
    };
    const idProducto = (nombre) => {
      const p = productos.find((p) => p.nombre === nombre);
      if (!p) throw new Error(`Producto no encontrado: ${nombre}`);
      return p.id;
    };

    // 1) Precio de venta por unidad extra de estos dos insumos.
    await queryInterface.bulkUpdate(
      'Insumos',
      { precioComercial: 500, updatedAt: ahora },
      { nombre: 'Queso (feta)' }
    );
    await queryInterface.bulkUpdate(
      'Insumos',
      { precioComercial: 400, updatedAt: ahora },
      { nombre: 'Panceta (bacon)' }
    );

    // 2) Donde ya vienen incluidos (esRemovible: true), habilitar también pedir de más.
    await queryInterface.bulkUpdate(
      'RecetaInsumos',
      { esAgregable: true, updatedAt: ahora },
      { insumoId: idInsumo('Queso (feta)') }
    );
    await queryInterface.bulkUpdate(
      'RecetaInsumos',
      { esAgregable: true, updatedAt: ahora },
      { insumoId: idInsumo('Panceta (bacon)') }
    );

    // 3) Sumarlos como extra a productos que hoy NO los traen de base.
    await queryInterface.bulkInsert('RecetaInsumos', [
      {
        productoId: idProducto('Hamburguesa Queso'),
        insumoId: idInsumo('Panceta (bacon)'),
        cantidadBase: 0,
        esRemovible: false,
        esAgregable: true,
        createdAt: ahora,
        updatedAt: ahora,
      },
      {
        productoId: idProducto('Hamburguesa Cebolla'),
        insumoId: idInsumo('Queso (feta)'),
        cantidadBase: 0,
        esRemovible: false,
        esAgregable: true,
        createdAt: ahora,
        updatedAt: ahora,
      },
    ]);
  },

  async down(queryInterface) {
    const [insumos] = await queryInterface.sequelize.query(
      `SELECT id, nombre FROM "Insumos"`
    );
    const [productos] = await queryInterface.sequelize.query(
      `SELECT id, nombre FROM "Productos"`
    );
    const idInsumo = (nombre) => insumos.find((i) => i.nombre === nombre)?.id;
    const idProducto = (nombre) => productos.find((p) => p.nombre === nombre)?.id;

    await queryInterface.bulkDelete('RecetaInsumos', {
      productoId: idProducto('Hamburguesa Queso'),
      insumoId: idInsumo('Panceta (bacon)'),
    });
    await queryInterface.bulkDelete('RecetaInsumos', {
      productoId: idProducto('Hamburguesa Cebolla'),
      insumoId: idInsumo('Queso (feta)'),
    });

    await queryInterface.bulkUpdate(
      'RecetaInsumos',
      { esAgregable: false },
      { insumoId: idInsumo('Queso (feta)') }
    );
    await queryInterface.bulkUpdate(
      'RecetaInsumos',
      { esAgregable: false },
      { insumoId: idInsumo('Panceta (bacon)') }
    );

    await queryInterface.bulkUpdate(
      'Insumos',
      { precioComercial: null },
      { nombre: 'Queso (feta)' }
    );
    await queryInterface.bulkUpdate(
      'Insumos',
      { precioComercial: null },
      { nombre: 'Panceta (bacon)' }
    );
  },
};
