'use strict';

// 1) Recetas e insumos que les faltaban a las papas con cheddar, papas con cheddar y bacon,
//    Gaseosa Naranja y Agua mineral (con su stock en todas las sucursales).
// 2) Los combos pasan a tener tamaños (regular, mediano, grande) con precios que suben,
//    y todos traen grupos elegibles de acompañamiento y de bebida (tabla ComboGrupos).
// 3) Ajusta cuánto stock consume cada tamaño de papas y bebidas (para bases ya sembradas).

const INSUMOS_NUEVOS = [
  { nombre: 'Salsa cheddar', unidadMedida: 'cucharada' },
  { nombre: 'Gaseosa naranja', unidadMedida: 'unidad' },
  { nombre: 'Agua mineral', unidadMedida: 'unidad' },
];

// { producto, insumo, cantidadBase }
const RECETAS_FALTANTES = [
  { producto: 'Papas con cheddar', insumo: 'Papas fritas', cantidadBase: 1 },
  { producto: 'Papas con cheddar', insumo: 'Salsa cheddar', cantidadBase: 2 },
  { producto: 'Papas con cheddar y bacon', insumo: 'Papas fritas', cantidadBase: 1 },
  { producto: 'Papas con cheddar y bacon', insumo: 'Salsa cheddar', cantidadBase: 2 },
  { producto: 'Papas con cheddar y bacon', insumo: 'Panceta (bacon)', cantidadBase: 2 },
  { producto: 'Gaseosa Naranja', insumo: 'Gaseosa naranja', cantidadBase: 1 },
  { producto: 'Agua mineral', insumo: 'Agua mineral', cantidadBase: 1 },
];

// Precio por tamaño [regular, mediano, grande]: pedir mediano o grande siempre cuesta más
const COMBOS = [
  { nombre: 'Hamburguesa con papas', precios: [7500, 8500, 9800] },
  { nombre: 'Duo Carnivoro', precios: [11800, 12900, 14200] },
  { nombre: 'Bacon Brutal', precios: [11900, 13000, 14300] },
  { nombre: 'Bacon & Pickles', precios: [10900, 12000, 13300] },
  { nombre: 'La Bestialidad', precios: [21500, 23000, 24800] },
];
const NOMBRES_TAMANIOS = ['regular', 'mediano', 'grande'];
// El tamaño del combo agranda lo que se elige (papas, bebida), no su receta fija
const FACTORES_COMBO = [1, 1, 1];

// Grupos elegibles de todo combo. "incluido" es el producto que ya viene en el precio;
// "insumo" es el de la receta que dejan de aportar (ahora lo aporta lo que se elija).
const GRUPOS_COMBO = [
  { nombre: 'Acompañamiento', categoria: 'Papas Fritas', incluido: 'Papas fritas', insumo: 'Papas fritas', icono: '🍟', orden: 1 },
  { nombre: 'Una bebida', categoria: 'Bebidas', incluido: 'Coca Cola', insumo: 'Coca-Cola 500ml', icono: '🥤', orden: 2 },
];

// Filas de receta que tenían estos combos antes de usar grupos (para el down)
const RECETA_ORIGINAL_COMBOS = [
  { combo: 'Hamburguesa con papas', insumo: 'Papas fritas' },
  { combo: 'Duo Carnivoro', insumo: 'Papas fritas' },
  { combo: 'Bacon Brutal', insumo: 'Papas fritas' },
  { combo: 'Bacon Brutal', insumo: 'Coca-Cola 500ml' },
  { combo: 'La Bestialidad', insumo: 'Papas fritas' },
  { combo: 'La Bestialidad', insumo: 'Coca-Cola 500ml' },
];

const STOCK_POR_UNIDAD = {
  unidad: { cantidad: 200, minimo: 40 },
  cucharada: { cantidad: 300, minimo: 60 },
};

module.exports = {
  async up(queryInterface) {
    const ahora = new Date();

    await queryInterface.sequelize.transaction(async (transaction) => {
      const consultar = async (texto, replacements) => {
        const [filas] = await queryInterface.sequelize.query(texto, { transaction, replacements });
        return filas;
      };

      // ---------- 1) Insumos nuevos, con stock en todas las sucursales ----------
      const existentes = await consultar('SELECT nombre FROM "Insumos"');
      const nuevos = INSUMOS_NUEVOS.filter((i) => !existentes.some((e) => e.nombre === i.nombre));

      if (nuevos.length > 0) {
        await queryInterface.bulkInsert(
          'Insumos',
          nuevos.map((i) => ({ ...i, precioComercial: null, createdAt: ahora, updatedAt: ahora })),
          { transaction }
        );

        const sucursales = await consultar('SELECT id FROM "Sucursals"');
        const insumosNuevos = await consultar(
          'SELECT id, nombre, "unidadMedida" FROM "Insumos" WHERE nombre IN (:nombres)',
          { nombres: nuevos.map((i) => i.nombre) }
        );
        const filasStock = [];
        for (const sucursal of sucursales) {
          for (const insumo of insumosNuevos) {
            const cfg = STOCK_POR_UNIDAD[insumo.unidadMedida] ?? { cantidad: 100, minimo: 20 };
            filasStock.push({
              insumoId: insumo.id,
              sucursalId: sucursal.id,
              cantidad: cfg.cantidad,
              stockMinimo: cfg.minimo,
              createdAt: ahora,
              updatedAt: ahora,
            });
          }
        }
        if (filasStock.length > 0) {
          await queryInterface.bulkInsert('StockSucursals', filasStock, { transaction });
        }
      }

      const productos = await consultar('SELECT id, nombre FROM "Productos"');
      const insumos = await consultar('SELECT id, nombre FROM "Insumos"');
      const idProducto = (nombre) => productos.find((p) => p.nombre === nombre)?.id;
      const idInsumo = (nombre) => {
        const id = insumos.find((i) => i.nombre === nombre)?.id;
        if (!id) throw new Error(`Insumo no encontrado: ${nombre}`);
        return id;
      };

      // ---------- 2) Recetas que faltaban (solo si el producto no tiene receta) ----------
      for (const nombre of [...new Set(RECETAS_FALTANTES.map((r) => r.producto))]) {
        const productoId = idProducto(nombre);
        if (!productoId) continue;

        const conReceta = await consultar(
          'SELECT 1 FROM "RecetaInsumos" WHERE "productoId" = :productoId LIMIT 1',
          { productoId }
        );
        if (conReceta.length > 0) continue;

        await queryInterface.bulkInsert(
          'RecetaInsumos',
          RECETAS_FALTANTES.filter((r) => r.producto === nombre).map((r) => ({
            productoId,
            insumoId: idInsumo(r.insumo),
            cantidadBase: r.cantidadBase,
            esRemovible: false,
            esAgregable: false,
            createdAt: ahora,
            updatedAt: ahora,
          })),
          { transaction }
        );
      }

      // ---------- 3) Combos: tamaños con precio y grupos de acompañamiento / bebida ----------
      const tamanios = await consultar('SELECT id, nombre FROM "Tamanios"');
      const idTamanio = (nombre) => tamanios.find((t) => t.nombre === nombre)?.id;

      for (const combo of COMBOS) {
        const productoId = idProducto(combo.nombre);
        if (!productoId) continue;

        // El precio "desde" del producto es el del tamaño regular
        await queryInterface.bulkUpdate(
          'Productos',
          { precio: combo.precios[0], updatedAt: ahora },
          { id: productoId },
          { transaction }
        );

        await queryInterface.bulkInsert(
          'ProductoTamanios',
          NOMBRES_TAMANIOS.map((nombre, i) => ({
            productoId,
            tamanioId: idTamanio(nombre),
            precio: combo.precios[i],
            etiqueta: null,
            factorStock: FACTORES_COMBO[i],
            createdAt: ahora,
            updatedAt: ahora,
          })),
          { transaction, ignoreDuplicates: true }
        );

        // Aunque ya existieran los tamaños, el combo no agranda su receta
        await queryInterface.sequelize.query(
          'UPDATE "ProductoTamanios" SET "factorStock" = 1 WHERE "productoId" = :productoId',
          { transaction, replacements: { productoId } }
        );

        for (const grupo of GRUPOS_COMBO) {
          const [categoria] = await consultar('SELECT id FROM "Categoria" WHERE nombre = :nombre', { nombre: grupo.categoria });
          const incluidoId = idProducto(grupo.incluido);
          if (!categoria || !incluidoId) {
            throw new Error(`Falta la categoría "${grupo.categoria}" o el producto "${grupo.incluido}"`);
          }

          const existe = await consultar(
            'SELECT 1 FROM "ComboGrupos" WHERE "productoId" = :productoId AND nombre = :nombre',
            { productoId, nombre: grupo.nombre }
          );
          if (existe.length === 0) {
            await queryInterface.bulkInsert(
              'ComboGrupos',
              [{
                productoId,
                nombre: grupo.nombre,
                categoriaId: categoria.id,
                productoIncluidoId: incluidoId,
                obligatorio: true,
                orden: grupo.orden,
                icono: grupo.icono,
                createdAt: ahora,
                updatedAt: ahora,
              }],
              { transaction }
            );
          }

          // Lo que antes venía fijo en la receta ahora lo aporta lo que se elija
          await queryInterface.sequelize.query(
            'DELETE FROM "RecetaInsumos" WHERE "productoId" = :productoId AND "insumoId" = :insumoId',
            { transaction, replacements: { productoId, insumoId: idInsumo(grupo.insumo) } }
          );
        }
      }

      // ---------- 4) Cuánto stock consume cada tamaño de papas y de bebidas ----------
      const ajustarFactores = (categoria, [mediano, grande]) =>
        queryInterface.sequelize.query(
          `UPDATE "ProductoTamanios" pt
           SET "factorStock" = CASE t.nombre WHEN 'mediano' THEN ${mediano} WHEN 'grande' THEN ${grande} ELSE 1 END
           FROM "Tamanios" t, "Productos" p, "Categoria" c
           WHERE t.id = pt."tamanioId" AND p.id = pt."productoId" AND c.id = p."categoriaId"
             AND c.nombre = :categoria`,
          { transaction, replacements: { categoria } }
        );
      await ajustarFactores('Papas Fritas', [1.5, 2]);
      await ajustarFactores('Bebidas', [1.4, 2.8]);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const consultar = async (texto, replacements) => {
        const [filas] = await queryInterface.sequelize.query(texto, { transaction, replacements });
        return filas;
      };

      // Combos: sin tamaños, sin lugares elegibles y con el precio que tenían
      const idsCombos = (await consultar(
        'SELECT id FROM "Productos" WHERE nombre IN (:nombres)',
        { nombres: COMBOS.map((c) => c.nombre) }
      )).map((p) => p.id);

      if (idsCombos.length > 0) {
        await queryInterface.sequelize.query(
          'DELETE FROM "ProductoTamanios" WHERE "productoId" IN (:ids)',
          { transaction, replacements: { ids: idsCombos } }
        );
        await queryInterface.sequelize.query(
          'DELETE FROM "ComboGrupos" WHERE "productoId" IN (:ids)',
          { transaction, replacements: { ids: idsCombos } }
        );

        // Vuelven a la receta las partes que traían fijas
        const productosDown = await consultar('SELECT id, nombre FROM "Productos"');
        const insumosDown = await consultar('SELECT id, nombre FROM "Insumos"');
        const filasReceta = RECETA_ORIGINAL_COMBOS
          .map((r) => ({
            productoId: productosDown.find((p) => p.nombre === r.combo)?.id,
            insumoId: insumosDown.find((i) => i.nombre === r.insumo)?.id,
          }))
          .filter((r) => r.productoId && r.insumoId)
          .map((r) => ({
            ...r,
            cantidadBase: 1,
            esRemovible: false,
            esAgregable: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
        if (filasReceta.length > 0) {
          await queryInterface.bulkInsert('RecetaInsumos', filasReceta, { transaction });
        }
        await queryInterface.sequelize.query(
          'UPDATE "Productos" SET precio = 1800 WHERE id IN (:ids)',
          { transaction, replacements: { ids: idsCombos } }
        );
      }

      // Recetas e insumos agregados
      const idsProductos = (await consultar(
        'SELECT id FROM "Productos" WHERE nombre IN (:nombres)',
        { nombres: [...new Set(RECETAS_FALTANTES.map((r) => r.producto))] }
      )).map((p) => p.id);
      if (idsProductos.length > 0) {
        await queryInterface.sequelize.query(
          'DELETE FROM "RecetaInsumos" WHERE "productoId" IN (:ids)',
          { transaction, replacements: { ids: idsProductos } }
        );
      }

      const nombresInsumos = INSUMOS_NUEVOS.map((i) => i.nombre);
      await queryInterface.sequelize.query(
        'DELETE FROM "StockSucursals" WHERE "insumoId" IN (SELECT id FROM "Insumos" WHERE nombre IN (:nombres))',
        { transaction, replacements: { nombres: nombresInsumos } }
      );
      await queryInterface.sequelize.query(
        'DELETE FROM "Insumos" WHERE nombre IN (:nombres)',
        { transaction, replacements: { nombres: nombresInsumos } }
      );
    });
  },
};
