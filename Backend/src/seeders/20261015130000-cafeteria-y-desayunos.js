'use strict';

// Menú Café, Desayunos y Meriendas, y los combos Desayuno y Merienda.
//
// IMPORTANTE: correr DESPUÉS de 20261015120000-catalogo-hamburguesas-y-combos.js,
// porque las recetas reutilizan insumos que crea ese seeder (Huevo y Palta).
//
//  1) Insumos nuevos (café, leche, medialunas, etc.) con su stock en todas las sucursales.
//  2) Menú Café: 7 productos con 3 tamaños (regular, mediano y grande).
//  3) Café (antes "Desayunos y Meriendas"): 7 productos de tamaño único (una fila "regular", para que se puedan elegir en un combo).
//  4) Categoría nueva "Combos de Cafetería", con:
//     - Combo Desayuno y Combo Merienda: un café y una comida a elegir, con tamaño único.
//     - 5 combos armados de antemano (Café y Medialunas, etc.): sin elecciones, con la receta de sus dos componentes.
//
// En un combo la opción más barata de cada grupo viene incluida (Espresso y Medialunas x2);
// las demás cobran la diferencia. Es re-ejecutable: no duplica nada que ya exista.

const TAMANIOS_CAFE = ['regular', 'mediano', 'grande'];

// ---------- Insumos nuevos ----------
// stock: opcional, para los que se gastan más rápido que el valor por defecto de su unidad
const INSUMOS_NUEVOS = [
  { nombre: 'Dosis de café espresso', unidadMedida: 'unidad', precioComercial: null, stock: { cantidad: 600, minimo: 120 } },
  { nombre: 'Leche', unidadMedida: 'porción', precioComercial: null, stock: { cantidad: 600, minimo: 120 } },
  { nombre: 'Cacao', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Jarabe de vainilla', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Canela', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Hielo', unidadMedida: 'porción', precioComercial: null, stock: { cantidad: 500, minimo: 100 } },
  { nombre: 'Medialuna', unidadMedida: 'unidad', precioComercial: null, stock: { cantidad: 400, minimo: 80 } },
  { nombre: 'Muffin de arándanos', unidadMedida: 'unidad', precioComercial: null },
  { nombre: 'Pan de miga', unidadMedida: 'unidad', precioComercial: null, stock: { cantidad: 400, minimo: 80 } },
  { nombre: 'Jamón cocido', unidadMedida: 'feta', precioComercial: null },
  { nombre: 'Masa de hot cakes', unidadMedida: 'unidad', precioComercial: null, stock: { cantidad: 400, minimo: 80 } },
  { nombre: 'Manteca', unidadMedida: 'porción', precioComercial: null },
  { nombre: 'Dulce de leche', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Miel', unidadMedida: 'cucharada', precioComercial: null },
];

// Stock inicial y mínimo por unidad de medida (mismo criterio que los seeders anteriores)
const STOCK_POR_UNIDAD = {
  unidad: { cantidad: 200, minimo: 40 },
  cucharada: { cantidad: 300, minimo: 60 },
  porción: { cantidad: 150, minimo: 30 },
  feta: { cantidad: 300, minimo: 60 },
};

// ---------- Menú Café ----------
// precios y etiquetas: regular / mediano / grande. factores: cuánto insumo gasta cada tamaño.
// receta: [insumo, cantidadBase, removible]
const CAFES = [
  {
    nombre: 'Espresso',
    descripcion: 'Café corto e intenso, preparado al momento. Elegí simple, doble o triple.',
    precios: [1300, 1600, 1900],
    etiquetas: ['Simple', 'Doble', 'Triple'],
    factores: [1, 2, 3],
    receta: [['Dosis de café espresso', 1]],
  },
  {
    nombre: 'Cortado',
    descripcion: 'Espresso con un toque de leche caliente. Corto, equilibrado y sin vueltas.',
    precios: [1600, 1900, 2300],
    etiquetas: ['120 ml', '180 ml', '240 ml'],
    factores: [1, 1.5, 2],
    receta: [['Dosis de café espresso', 1], ['Leche', 1]],
  },
  {
    nombre: 'Café con Leche',
    descripcion: 'Café suave con leche caliente. El de todos los días.',
    precios: [1900, 2300, 2700],
    etiquetas: ['240 ml', '350 ml', '470 ml'],
    factores: [1, 1.5, 2],
    receta: [['Dosis de café espresso', 1], ['Leche', 2]],
  },
  {
    nombre: 'Capuchino',
    descripcion: 'Espresso, leche vaporizada y una capa de espuma, con canela por encima.',
    precios: [2200, 2600, 3000],
    etiquetas: ['240 ml', '350 ml', '470 ml'],
    factores: [1, 1.5, 2],
    receta: [['Dosis de café espresso', 1], ['Leche', 2], ['Canela', 1, true]],
  },
  {
    nombre: 'Latte Vainilla',
    descripcion: 'Café con abundante leche cremosa y un toque de jarabe de vainilla.',
    precios: [2400, 2800, 3200],
    etiquetas: ['240 ml', '350 ml', '470 ml'],
    factores: [1, 1.5, 2],
    receta: [['Dosis de café espresso', 1], ['Leche', 3], ['Jarabe de vainilla', 1, true]],
  },
  {
    nombre: 'Chocolatada Caliente',
    descripcion: 'Leche caliente con cacao, cremosa y reconfortante. Sin café, ideal para los más chicos.',
    precios: [2200, 2600, 3000],
    etiquetas: ['240 ml', '350 ml', '470 ml'],
    factores: [1, 1.5, 2],
    receta: [['Leche', 3], ['Cacao', 2]],
  },
  {
    nombre: 'Frappé de Café',
    descripcion: 'Café frío licuado con hielo y leche. Refrescante, para los días de calor.',
    precios: [2800, 3300, 3800],
    etiquetas: ['300 ml', '400 ml', '500 ml'],
    factores: [1, 1.4, 1.8],
    receta: [['Dosis de café espresso', 1], ['Leche', 2], ['Hielo', 2]],
  },
];

// ---------- Desayunos y Meriendas (tamaño único) ----------
const COMIDAS = [
  {
    nombre: 'Medialunas x2',
    descripcion: 'Dos medialunas de manteca, recién horneadas.',
    precio: 1700,
    receta: [['Medialuna', 2]],
  },
  {
    nombre: 'Medialunas x3',
    descripcion: 'Tres medialunas de manteca, recién horneadas. La porción más grande.',
    precio: 2400,
    receta: [['Medialuna', 3]],
  },
  {
    nombre: 'Muffin de Arándanos',
    descripcion: 'Muffin esponjoso con arándanos. Dulce justo para acompañar el café.',
    precio: 2200,
    receta: [['Muffin de arándanos', 1]],
  },
  {
    nombre: 'Tostado de Jamón y Queso',
    descripcion: 'Clásico tostado en pan de miga, con jamón cocido y queso derretido.',
    precio: 2900,
    receta: [['Pan de miga', 2], ['Jamón cocido', 2], ['Queso (feta)', 2]],
  },
  {
    nombre: 'Tostadas con Palta',
    descripcion: 'Pan tostado con palta cremosa y una pizca de sal. Liviano y fresco.',
    precio: 3400,
    receta: [['Pan de miga', 2], ['Palta', 2, true]],
  },
  {
    nombre: 'Hot Cakes',
    descripcion: 'Tres panqueques esponjosos con manteca y miel o dulce de leche. Un desayuno de domingo todos los días.',
    precio: 3900,
    receta: [['Masa de hot cakes', 3], ['Manteca', 1, true], ['Miel', 1, true], ['Dulce de leche', 1, true]],
  },
  {
    nombre: 'Desayuno Americano',
    descripcion: 'Tocino crocante, huevos, queso y pan tostado. Para arrancar el día con todo.',
    precio: 4800,
    receta: [['Pan de miga', 2], ['Panceta (bacon)', 3, true], ['Huevo', 2, true], ['Queso (feta)', 1, true]],
  },
];

// ---------- Combos (tamaño único; la receta sale de los grupos elegibles) ----------
const COMBOS = [
  {
    nombre: 'Combo Desayuno',
    descripcion: 'Empezá el día con un café y algo rico para acompañarlo. Elegí tu café y tu comida: medialunas, tostado, hot cakes y más.',
    precio: 2800,
  },
  {
    nombre: 'Combo Merienda',
    descripcion: 'La pausa de la tarde: un café y algo para acompañarlo. Elegí tu café y tu comida: medialunas, muffin, tostado y más.',
    precio: 2800,
  },
];

// ---------- Categorías (se buscan por nombre) ----------
const CATEGORIA_CAFE = 'Menú Café';
// La categoría de las comidas de cafetería pasa de "Desayunos y Meriendas" a "Café".
// Se acepta cualquiera de los dos nombres, así funciona antes y después del renombre.
const CATEGORIA_DESAYUNOS = ['Café', 'Desayunos y Meriendas'];
const CATEGORIA_COMBOS = 'Combos';
const CATEGORIA_COMBOS_CAFETERIA = 'Combos de Cafetería';

// ---------- Combos armados de antemano ----------
// Un producto más, con la receta de sus dos componentes juntos y sin grupos elegibles.
// precio: un poco menos que la suma de sus partes (se indica entre paréntesis).
const COMBOS_ARMADOS = [
  {
    nombre: 'Café y Medialunas',
    descripcion: 'El clásico de siempre: un café con leche y dos medialunas de manteca recién horneadas.',
    precio: 3300, // 1900 + 1700
    componentes: ['Café con Leche', 'Medialunas x2'],
  },
  {
    nombre: 'Tostado Express',
    descripcion: 'Un tostado de jamón y queso bien caliente con un cortado. Rápido, rico y contundente.',
    precio: 4200, // 2900 + 1600
    componentes: ['Tostado de Jamón y Queso', 'Cortado'],
  },
  {
    nombre: 'Dulce Mañana',
    descripcion: 'Hot cakes con manteca y miel o dulce de leche, acompañados de un latte de vainilla.',
    precio: 5900, // 3900 + 2400
    componentes: ['Hot Cakes', 'Latte Vainilla'],
  },
  {
    nombre: 'Americano Completo',
    descripcion: 'Desayuno americano con tocino, huevos, queso y pan, más un café con leche para empezar con todo.',
    precio: 6400, // 4800 + 1900
    componentes: ['Desayuno Americano', 'Café con Leche'],
  },
  {
    nombre: 'Merienda Dulce',
    descripcion: 'Un muffin de arándanos esponjoso con una chocolatada caliente. La merienda de siempre.',
    precio: 4100, // 2200 + 2200
    componentes: ['Muffin de Arándanos', 'Chocolatada Caliente'],
  },
];

// Grupos de Combo Desayuno y Combo Merienda. El producto incluido es el más barato de su categoría.
const GRUPOS_COMBO = [
  { nombre: 'Café', categoria: 'Menú Café', incluido: 'Espresso', icono: '☕', orden: 1 },
  { nombre: 'Para comer', categoria: CATEGORIA_DESAYUNOS, incluido: 'Medialunas x2', icono: '🥐', orden: 2 },
];



module.exports = {
  // Para poder revisar los datos sin tocar la base
  _datos: { INSUMOS_NUEVOS, CAFES, COMIDAS, COMBOS, COMBOS_ARMADOS, GRUPOS_COMBO },

  async up(queryInterface) {
    const ahora = new Date();

    await queryInterface.sequelize.transaction(async (transaction) => {
      const consultar = async (texto, replacements) => {
        const [filas] = await queryInterface.sequelize.query(texto, { transaction, replacements });
        return filas;
      };
      const ejecutar = (texto, replacements) => queryInterface.sequelize.query(texto, { transaction, replacements });
      const cargarProductos = () => consultar('SELECT id, nombre FROM "Productos" WHERE "deletedAt" IS NULL');
      const cargarInsumos = () => consultar('SELECT id, nombre, "precioComercial" FROM "Insumos"');

      // Acepta un nombre o una lista de nombres posibles (se usa el primero que exista)
      const idCategoria = async (nombres) => {
        const lista = [].concat(nombres);
        const filas = await consultar('SELECT id, nombre FROM "Categoria" WHERE nombre IN (:lista)', { lista });
        const elegida = lista.map((nombre) => filas.find((f) => f.nombre === nombre)).find(Boolean);
        if (!elegida) throw new Error(`Falta la categoría "${lista[0]}": corré primero el seeder de categorías`);
        return elegida.id;
      };

      // "Desayunos y Meriendas" pasa a llamarse "Café" (si la base todavía tiene el nombre viejo).
      // Este cambio no se revierte en el down: depende de cómo esté el seeder de categorías.
      await ejecutar(
        `UPDATE "Categoria" SET nombre = 'Café', "updatedAt" = NOW()
          WHERE nombre = 'Desayunos y Meriendas'
            AND NOT EXISTS (SELECT 1 FROM "Categoria" WHERE nombre = 'Café')`
      );
      const categoriaCafe = await idCategoria(CATEGORIA_CAFE);
      const categoriaDesayunos = await idCategoria(CATEGORIA_DESAYUNOS);
      const categoriaCombos = await idCategoria(CATEGORIA_COMBOS);

      // La categoría nueva donde viven todos los combos de cafetería
      const [categoriaExistente] = await consultar('SELECT id FROM "Categoria" WHERE nombre = :nombre', {
        nombre: CATEGORIA_COMBOS_CAFETERIA,
      });
      if (!categoriaExistente) {
        await queryInterface.bulkInsert(
          'Categoria',
          [{ nombre: CATEGORIA_COMBOS_CAFETERIA, createdAt: ahora, updatedAt: ahora }],
          { transaction }
        );
      }
      const categoriaCombosCafeteria = await idCategoria(CATEGORIA_COMBOS_CAFETERIA);

      // ---------- 1) Insumos nuevos, con stock en todas las sucursales ----------
      const insumosExistentes = await cargarInsumos();
      const insumosAInsertar = INSUMOS_NUEVOS.filter((i) => !insumosExistentes.some((e) => e.nombre === i.nombre));

      if (insumosAInsertar.length > 0) {
        await queryInterface.bulkInsert(
          'Insumos',
          insumosAInsertar.map(({ nombre, unidadMedida, precioComercial }) => ({
            nombre,
            unidadMedida,
            precioComercial,
            createdAt: ahora,
            updatedAt: ahora,
          })),
          { transaction }
        );

        const sucursales = await consultar('SELECT id FROM "Sucursals"');
        const recienCreados = await consultar('SELECT id, nombre, "unidadMedida" FROM "Insumos" WHERE nombre IN (:nombres)', {
          nombres: insumosAInsertar.map((i) => i.nombre),
        });
        const filasStock = [];
        for (const sucursal of sucursales) {
          for (const insumo of recienCreados) {
            const definicion = insumosAInsertar.find((i) => i.nombre === insumo.nombre);
            const cfg = definicion.stock ?? STOCK_POR_UNIDAD[insumo.unidadMedida] ?? { cantidad: 100, minimo: 20 };
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

      const insumos = await cargarInsumos();
      const insumoPorNombre = (nombre) => {
        const insumo = insumos.find((i) => i.nombre === nombre);
        if (!insumo) {
          throw new Error(`Insumo no encontrado: ${nombre}. Si es Huevo o Palta, corré primero el seeder de hamburguesas`);
        }
        return insumo;
      };

      // ---------- 2) Productos nuevos ----------
      let productos = await cargarProductos();
      const filasProductos = [
        ...CAFES.map((c) => ({ ...c, categoriaId: categoriaCafe, precioBase: c.precios[0] })),
        ...COMIDAS.map((c) => ({ ...c, categoriaId: categoriaDesayunos, precioBase: c.precio })),
        ...COMBOS.map((c) => ({ ...c, categoriaId: categoriaCombosCafeteria, precioBase: c.precio })),
        ...COMBOS_ARMADOS.map((c) => ({ ...c, categoriaId: categoriaCombosCafeteria, precioBase: c.precio })),
      ].filter((p) => !productos.some((existente) => existente.nombre === p.nombre));

      if (filasProductos.length > 0) {
        await queryInterface.bulkInsert(
          'Productos',
          filasProductos.map((p) => ({
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precioBase,
            imagen: '',
            disponible: true,
            categoriaId: p.categoriaId,
            createdAt: ahora,
            updatedAt: ahora,
          })),
          { transaction }
        );
      }

      // Si se corrió una versión anterior, Desayuno y Merienda quedaron en "Combos": se mueven a la nueva categoría
      await ejecutar(
        'UPDATE "Productos" SET "categoriaId" = :nueva, "updatedAt" = NOW() WHERE nombre IN (:nombres) AND "categoriaId" = :anterior',
        { nueva: categoriaCombosCafeteria, anterior: categoriaCombos, nombres: COMBOS.map((c) => c.nombre) }
      );

      productos = await cargarProductos();
      const idProducto = (nombre) => {
        const producto = productos.find((p) => p.nombre === nombre);
        if (!producto) throw new Error(`Producto no encontrado: ${nombre}`);
        return producto.id;
      };

      // ---------- 3) Recetas (el combo no tiene: sus ingredientes salen de los grupos) ----------
      for (const p of [...CAFES, ...COMIDAS]) {
        const productoId = idProducto(p.nombre);
        const conReceta = await consultar('SELECT 1 FROM "RecetaInsumos" WHERE "productoId" = :productoId LIMIT 1', { productoId });
        if (conReceta.length > 0) continue;

        await queryInterface.bulkInsert(
          'RecetaInsumos',
          p.receta.map(([nombreInsumo, cantidadBase, removible = false]) => {
            const insumo = insumoPorNombre(nombreInsumo);
            return {
              productoId,
              insumoId: insumo.id,
              cantidadBase,
              esRemovible: removible,
              // Se puede pedir de más solo si el insumo tiene precio de venta como extra
              esAgregable: removible && insumo.precioComercial !== null,
              createdAt: ahora,
              updatedAt: ahora,
            };
          }),
          { transaction }
        );
      }

      // Los combos armados llevan la receta de sus dos componentes juntos (si un insumo se repite, se suma)
      for (const combo of COMBOS_ARMADOS) {
        const comboId = idProducto(combo.nombre);
        const conReceta = await consultar('SELECT 1 FROM "RecetaInsumos" WHERE "productoId" = :productoId LIMIT 1', {
          productoId: comboId,
        });
        if (conReceta.length > 0) continue;

        await ejecutar(
          `INSERT INTO "RecetaInsumos" ("productoId", "insumoId", "cantidadBase", "esRemovible", "esAgregable", "createdAt", "updatedAt")
           SELECT :comboId, "insumoId", SUM("cantidadBase"), BOOL_OR("esRemovible"), BOOL_OR("esAgregable"), NOW(), NOW()
             FROM "RecetaInsumos"
            WHERE "productoId" IN (:componentes)
            GROUP BY "insumoId"`,
          { comboId, componentes: combo.componentes.map(idProducto) }
        );
      }

      // ---------- 4) Tamaños ----------
      const tamanios = await consultar('SELECT id, nombre FROM "Tamanios"');
      const idTamanio = (nombre) => {
        const tamanio = tamanios.find((t) => t.nombre === nombre);
        if (!tamanio) throw new Error(`Falta el tamaño "${nombre}": corré primero las migraciones`);
        return tamanio.id;
      };

      // Cada fila: [productoId, tamaño, precio, etiqueta, factor]
      const filasTamanios = [];
      for (const c of CAFES) {
        TAMANIOS_CAFE.forEach((tamanio, i) =>
          filasTamanios.push([idProducto(c.nombre), tamanio, c.precios[i], c.etiquetas[i], c.factores[i]])
        );
      }
      // Tamaño único: una sola fila "regular", para que se pueda elegir dentro de un combo.
      // Los combos armados no la necesitan: no tienen elecciones y se compran como un producto simple.
      for (const c of [...COMIDAS, ...COMBOS]) {
        filasTamanios.push([idProducto(c.nombre), 'regular', c.precio, null, 1]);
      }

      await queryInterface.bulkInsert(
        'ProductoTamanios',
        filasTamanios.map(([productoId, tamanio, precio, etiqueta, factorStock]) => ({
          productoId,
          tamanioId: idTamanio(tamanio),
          precio,
          etiqueta,
          factorStock,
          createdAt: ahora,
          updatedAt: ahora,
        })),
        { transaction, ignoreDuplicates: true }
      );
      for (const [productoId, tamanio, precio] of filasTamanios) {
        await ejecutar(
          'UPDATE "ProductoTamanios" SET precio = :precio, "updatedAt" = NOW() WHERE "productoId" = :productoId AND "tamanioId" = :tamanioId',
          { precio, productoId, tamanioId: idTamanio(tamanio) }
        );
      }

      // ---------- 5) Grupos elegibles de los combos ----------
      for (const combo of COMBOS) {
        const productoId = idProducto(combo.nombre);
        const conGrupos = await consultar('SELECT 1 FROM "ComboGrupos" WHERE "productoId" = :productoId LIMIT 1', { productoId });
        if (conGrupos.length > 0) continue;

        for (const grupo of GRUPOS_COMBO) {
          await queryInterface.bulkInsert(
            'ComboGrupos',
            [{
              productoId,
              nombre: grupo.nombre,
              categoriaId: await idCategoria(grupo.categoria),
              productoIncluidoId: idProducto(grupo.incluido),
              obligatorio: true,
              orden: grupo.orden,
              icono: grupo.icono,
              createdAt: ahora,
              updatedAt: ahora,
            }],
            { transaction }
          );
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const consultar = async (texto, replacements) => {
        const [filas] = await queryInterface.sequelize.query(texto, { transaction, replacements });
        return filas;
      };
      const ejecutar = (texto, replacements) => queryInterface.sequelize.query(texto, { transaction, replacements });

      const nombres = [...CAFES, ...COMIDAS, ...COMBOS, ...COMBOS_ARMADOS].map((p) => p.nombre);
      const creados = await consultar('SELECT id FROM "Productos" WHERE nombre IN (:nombres)', { nombres });
      const ids = creados.map((p) => p.id);
      if (ids.length > 0) {
        await ejecutar('DELETE FROM "ComboGrupos" WHERE "productoId" IN (:ids)', { ids });
        await ejecutar('DELETE FROM "ProductoTamanios" WHERE "productoId" IN (:ids)', { ids });
        await ejecutar('DELETE FROM "RecetaInsumos" WHERE "productoId" IN (:ids)', { ids });
        await ejecutar('DELETE FROM "Productos" WHERE id IN (:ids)', { ids });
      }

      // La categoría nueva se borra solo si quedó vacía
      await ejecutar(
        'DELETE FROM "Categoria" WHERE nombre = :nombre AND NOT EXISTS (SELECT 1 FROM "Productos" WHERE "categoriaId" = "Categoria".id)',
        { nombre: CATEGORIA_COMBOS_CAFETERIA }
      );

      const nombresInsumos = INSUMOS_NUEVOS.map((i) => i.nombre);
      await ejecutar(
        'DELETE FROM "StockSucursals" WHERE "insumoId" IN (SELECT id FROM "Insumos" WHERE nombre IN (:nombres))',
        { nombres: nombresInsumos }
      );
      await ejecutar('DELETE FROM "Insumos" WHERE nombre IN (:nombres)', { nombres: nombresInsumos });
    });
  },
};
