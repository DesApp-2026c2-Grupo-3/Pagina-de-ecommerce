'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const ahora = new Date();

    const [productos] = await queryInterface.sequelize.query(
      `SELECT id, nombre FROM "Productos"`
    );
    const [insumos] = await queryInterface.sequelize.query(
      `SELECT id, nombre FROM "Insumos"`
    );

    const idProducto = (nombre) => {
      const p = productos.find((p) => p.nombre === nombre);
      if (!p) throw new Error(`Producto no encontrado en seeder de recetas: ${nombre}`);
      return p.id;
    };
    const idInsumo = (nombre) => {
      const i = insumos.find((i) => i.nombre === nombre);
      if (!i) throw new Error(`Insumo no encontrado en seeder de recetas: ${nombre}`);
      return i.id;
    };

    // { producto: 'Nombre', insumo: 'Nombre', cantidadBase, esRemovible? }
    const receta = [
      // Hamburguesa Gourmet
      { producto: 'Hamburguesa Gourmet', insumo: 'Pan de hamburguesa', cantidadBase: 1 },
      { producto: 'Hamburguesa Gourmet', insumo: 'Medallón de carne (vacuno)', cantidadBase: 1 },
      { producto: 'Hamburguesa Gourmet', insumo: 'Salsa especial de la casa', cantidadBase: 1, esRemovible: true },

      // Hamburguesa Cebolla
      { producto: 'Hamburguesa Cebolla', insumo: 'Pan de hamburguesa', cantidadBase: 1 },
      { producto: 'Hamburguesa Cebolla', insumo: 'Medallón de carne (vacuno)', cantidadBase: 1 },
      { producto: 'Hamburguesa Cebolla', insumo: 'Tomate', cantidadBase: 2, esRemovible: true },
      { producto: 'Hamburguesa Cebolla', insumo: 'Lechuga', cantidadBase: 2, esRemovible: true },
      { producto: 'Hamburguesa Cebolla', insumo: 'Cebolla', cantidadBase: 2, esRemovible: true },

      // Hamburguesa Queso
      { producto: 'Hamburguesa Queso', insumo: 'Pan de hamburguesa', cantidadBase: 1 },
      { producto: 'Hamburguesa Queso', insumo: 'Medallón de carne (vacuno)', cantidadBase: 1 },
      { producto: 'Hamburguesa Queso', insumo: 'Queso (feta)', cantidadBase: 1, esRemovible: true },
      { producto: 'Hamburguesa Queso', insumo: 'Papas fritas', cantidadBase: 0.5, esRemovible: true },

      // Hamburguesa Bacon
      { producto: 'Hamburguesa Bacon', insumo: 'Pan de hamburguesa', cantidadBase: 1 },
      { producto: 'Hamburguesa Bacon', insumo: 'Medallón de carne (vacuno)', cantidadBase: 1 },
      { producto: 'Hamburguesa Bacon', insumo: 'Panceta (bacon)', cantidadBase: 3, esRemovible: true },
      { producto: 'Hamburguesa Bacon', insumo: 'Salsa especial de la casa', cantidadBase: 1, esRemovible: true },

      // Hamburguesa Doble
      { producto: 'Hamburguesa Doble', insumo: 'Pan de hamburguesa', cantidadBase: 1 },
      { producto: 'Hamburguesa Doble', insumo: 'Medallón de carne (vacuno)', cantidadBase: 2 },
      { producto: 'Hamburguesa Doble', insumo: 'Queso (feta)', cantidadBase: 1, esRemovible: true },

      // Hamburguesa Abominacion
      { producto: 'Hamburguesa Abominacion', insumo: 'Pan de hamburguesa', cantidadBase: 1 },
      { producto: 'Hamburguesa Abominacion', insumo: 'Medallón de carne (vacuno)', cantidadBase: 1 },
      { producto: 'Hamburguesa Abominacion', insumo: 'Cebolla', cantidadBase: 3, esRemovible: true },

      // Pollo Frito
      { producto: 'Pollo Frito', insumo: 'Pechuga de pollo', cantidadBase: 1 },

      // Papas Medianas
      { producto: 'Papas Medianas', insumo: 'Papas fritas', cantidadBase: 1 },

      // Palitos de Muzzarela
      { producto: 'Palitos de Muzzarela', insumo: 'Palito de muzzarella', cantidadBase: 6 },

      // Nuggets de Pollo
      { producto: 'Nuggets de Pollo', insumo: 'Nugget de pollo', cantidadBase: 6 },

      // Hamburguesa con papas (combo)
      { producto: 'Hamburguesa con papas', insumo: 'Pan de hamburguesa', cantidadBase: 1 },
      { producto: 'Hamburguesa con papas', insumo: 'Medallón de carne (vacuno)', cantidadBase: 1 },
      { producto: 'Hamburguesa con papas', insumo: 'Queso (feta)', cantidadBase: 1, esRemovible: true },
      { producto: 'Hamburguesa con papas', insumo: 'Papas fritas', cantidadBase: 1 },

      // Duo Carnivoro (2 hamburguesas + papas)
      { producto: 'Duo Carnivoro', insumo: 'Pan de hamburguesa', cantidadBase: 2 },
      { producto: 'Duo Carnivoro', insumo: 'Medallón de carne (vacuno)', cantidadBase: 2 },
      { producto: 'Duo Carnivoro', insumo: 'Panceta (bacon)', cantidadBase: 4, esRemovible: true },
      { producto: 'Duo Carnivoro', insumo: 'Papas fritas', cantidadBase: 1 },

      // Bacon Brutal (hamburguesa + papas + gaseosa)
      { producto: 'Bacon Brutal', insumo: 'Pan de hamburguesa', cantidadBase: 1 },
      { producto: 'Bacon Brutal', insumo: 'Medallón de carne (vacuno)', cantidadBase: 1 },
      { producto: 'Bacon Brutal', insumo: 'Panceta (bacon)', cantidadBase: 3, esRemovible: true },
      { producto: 'Bacon Brutal', insumo: 'Papas fritas', cantidadBase: 1 },
      { producto: 'Bacon Brutal', insumo: 'Coca-Cola 500ml', cantidadBase: 1 },

      // Bacon & Pickles
      { producto: 'Bacon & Pickles', insumo: 'Pan de hamburguesa', cantidadBase: 1 },
      { producto: 'Bacon & Pickles', insumo: 'Medallón de carne (vacuno)', cantidadBase: 1 },
      { producto: 'Bacon & Pickles', insumo: 'Panceta (bacon)', cantidadBase: 3, esRemovible: true },
      { producto: 'Bacon & Pickles', insumo: 'Pepino', cantidadBase: 3, esRemovible: true },

      // La Bestialidad (doble hamburguesa + papas + nuggets + pizza + gaseosa)
      { producto: 'La Bestialidad', insumo: 'Pan de hamburguesa', cantidadBase: 2 },
      { producto: 'La Bestialidad', insumo: 'Medallón de carne (vacuno)', cantidadBase: 2 },
      { producto: 'La Bestialidad', insumo: 'Papas fritas', cantidadBase: 1 },
      { producto: 'La Bestialidad', insumo: 'Nugget de pollo', cantidadBase: 6 },
      { producto: 'La Bestialidad', insumo: 'Mini pizza individual', cantidadBase: 1 },
      { producto: 'La Bestialidad', insumo: 'Coca-Cola 500ml', cantidadBase: 1 },

      // Bebidas
      { producto: 'Coca Cola 500ml', insumo: 'Coca-Cola 500ml', cantidadBase: 1 },
      { producto: 'Limonada', insumo: 'Limonada preparada', cantidadBase: 1 },
    ];

    await queryInterface.bulkInsert(
      'RecetaInsumos',
      receta.map((r) => ({
        productoId: idProducto(r.producto),
        insumoId: idInsumo(r.insumo),
        cantidadBase: r.cantidadBase,
        esRemovible: r.esRemovible ?? false,
        esAgregable: false,
        createdAt: ahora,
        updatedAt: ahora,
      }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('RecetaInsumos', null, {});
  },
};