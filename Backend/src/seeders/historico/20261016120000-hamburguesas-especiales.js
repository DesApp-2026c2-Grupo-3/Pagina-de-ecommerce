'use strict';

// Hamburguesas especiales: Ambrosía del Olimpo, La Divina ConMedia (Res), Pumper-Nic (RETRO) y Fast & Furious.
//
// IMPORTANTE: correr DESPUÉS de 20261015120000-catalogo-hamburguesas-y-combos.js,
// porque las recetas reutilizan insumos que crea ese seeder (Huevo, Rúcula, Salsa BBQ, cebolla caramelizada y crispy, Mayonesa).
//
//  1) Insumos nuevos con su stock en todas las sucursales.
//  2) Las 4 hamburguesas, cada una con su receta.
//  3) Un combo por hamburguesa (con tamaños y grupos de papas y bebida), igual que el resto del catálogo.
//
// Es re-ejecutable: no duplica nada que ya exista. Los precios están en las constantes de abajo.

// ---------- Precios de combos: hamburguesa + papas + bebida, con un pequeño ahorro ----------
const SUMA_COMBO_POR_TAMANIO = [2500, 3500, 4800]; // regular, mediano, grande (sobre el precio de la hamburguesa)
const NOMBRES_TAMANIOS = ['regular', 'mediano', 'grande'];
const precioCombo = (precioHamburguesa) => SUMA_COMBO_POR_TAMANIO.map((suma) => precioHamburguesa + suma);

// ---------- Insumos nuevos ----------
// precioComercial: lo que se cobra por cada unidad extra (null = no se puede pedir de más)
const INSUMOS_NUEVOS = [
  { nombre: 'Medallón de carne 200 g', unidadMedida: 'unidad', precioComercial: null },
  { nombre: 'Medallón de carne media libra', unidadMedida: 'unidad', precioComercial: null },
  { nombre: 'Pan de chía', unidadMedida: 'unidad', precioComercial: null },
  { nombre: 'Pan de brioche', unidadMedida: 'unidad', precioComercial: null },
  { nombre: 'Salsa de sésamo', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Cebolla morada', unidadMedida: 'aro', precioComercial: null },
  { nombre: 'Queso parmesano', unidadMedida: 'porción', precioComercial: 500 },
  { nombre: 'Ajíes asados', unidadMedida: 'porción', precioComercial: 300 },
  { nombre: 'Salsa tártara', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Salamín picado', unidadMedida: 'porción', precioComercial: 600 },
  { nombre: 'Queso tipo Mar del Plata', unidadMedida: 'feta', precioComercial: 600 },
  { nombre: 'Aceitunas verdes', unidadMedida: 'porción', precioComercial: 300 },
];

// Stock inicial y mínimo por unidad de medida (mismo criterio que los seeders anteriores)
const STOCK_POR_UNIDAD = {
  unidad: { cantidad: 200, minimo: 40 },
  aro: { cantidad: 400, minimo: 80 },
  cucharada: { cantidad: 300, minimo: 60 },
  porción: { cantidad: 150, minimo: 30 },
  feta: { cantidad: 300, minimo: 60 },
};

// ---------- Hamburguesas ----------
// receta: [insumo, cantidadBase, removible]. Pan y carne nunca son removibles ni agregables.
const HAMBURGUESAS = [
  {
    nombre: 'Ambrosía del Olimpo',
    anterior: 'Ambrosía de los Dioses',
    precio: 8900,
    descripcion:
      '¿Querés sentirte como un Dios? Ahora podés con estos exuberantes 200gr de pura carne de res, una deliciosa salsa de sésamo, rúcula y cebolla morada con pan de semillas de chía. La cura definitiva para el hambre, una deliciosa panacea.',
    receta: [
      ['Pan de chía', 1], ['Medallón de carne 200 g', 1], ['Salsa de sésamo', 1, true],
      ['Rúcula', 2, true], ['Cebolla morada', 3, true], ['Tomate', 2, true], ['Queso (feta)', 1, true],
    ],
  },
  {
    nombre: 'La Divina ConMedia (Res)',
    anterior: 'La divina conMedia (ReS)',
    precio: 12500,
    descripcion:
      'El infierno de Dante. Un descenso inevitable a la locura. Atrevete a recorrer sus 9 círculos: pan de brioche, huevos revueltos, tocino, rúcula, parmesano, carne de res de media libra, ajíes asados, barbacoa, y el ingrediente secreto una deliciosa salsa tártara. ¡Sálvese quien pueda!',
    receta: [
      ['Pan de brioche', 1], ['Medallón de carne media libra', 1], ['Huevo', 2, true],
      ['Panceta (bacon)', 3, true], ['Rúcula', 2, true], ['Queso parmesano', 1, true],
      ['Ajíes asados', 2, true], ['Salsa BBQ', 1, true], ['Salsa tártara', 1, true],
    ],
  },
  {
    nombre: 'Pumper-Nic (RETRO)',
    anterior: 'Fast De Colección',
    precio: 10500,
    descripcion:
      "¿Sos de los nostálgicos? Tenemos algo especial para vos. Reviví los 80' en todo su esplendor. Doble carne, cheddar fundido, panceta crocante, cebolla caramelizada y cebolla crispy, con la salsa especial de la casa en pan de brioche. ¡Dejate transportar!",
    receta: [
      ['Pan de brioche', 1], ['Medallón de carne (vacuno)', 2], ['Queso (feta)', 2, true],
      ['Panceta (bacon)', 3, true], ['Cebolla caramelizada', 1, true], ['Cebolla crispy', 1, true],
      ['Salsa especial de la casa', 1, true],
    ],
  },
  {
    nombre: 'Fast & Furious',
    precio: 7900,
    descripcion:
      'La carrera aún no empezó ¡Poné a prueba tu adrenalina! Sale a la pista con: salamín picado y queso tipo mar del plata (además de carne, aceitunas verdes, pepinillos y mayonesa). Ahora sí vas a vivir ¡una auténtica picada!',
    receta: [
      ['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 1], ['Salamín picado', 1, true],
      ['Queso tipo Mar del Plata', 2, true], ['Aceitunas verdes', 1, true], ['Pepino', 3, true],
      ['Mayonesa', 1, true],
    ],
  },
];

// Grupos elegibles de todo combo (igual que en los seeders anteriores)
const GRUPOS_COMBO = [
  { nombre: 'Acompañamiento', categoria: 'Papas Fritas', incluido: 'Papas fritas', icono: '🍟', orden: 1 },
  { nombre: 'Una bebida', categoria: 'Bebidas', incluido: 'Coca Cola', icono: '🥤', orden: 2 },
];

// En el seeder de categorías se llama "Hamburguesas" (antes "Hamburguesa"): se acepta cualquiera de los dos
const CATEGORIA_HAMBURGUESAS = ['Hamburguesas', 'Hamburguesa'];
const CATEGORIA_COMBOS = 'Combos';

const nombreCombo = (hamburguesa) => `Combo ${hamburguesa}`;

module.exports = {
  // Para poder revisar los datos sin tocar la base
  _datos: { INSUMOS_NUEVOS, HAMBURGUESAS },

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
      const categoriaHamburguesas = await idCategoria(CATEGORIA_HAMBURGUESAS);
      const categoriaCombos = await idCategoria(CATEGORIA_COMBOS);

      // ---------- 1) Insumos nuevos, con stock en todas las sucursales ----------
      const insumosExistentes = await cargarInsumos();
      const insumosAInsertar = INSUMOS_NUEVOS.filter((i) => !insumosExistentes.some((e) => e.nombre === i.nombre));

      if (insumosAInsertar.length > 0) {
        await queryInterface.bulkInsert(
          'Insumos',
          insumosAInsertar.map((i) => ({ ...i, createdAt: ahora, updatedAt: ahora })),
          { transaction }
        );

        const sucursales = await consultar('SELECT id FROM "Sucursals"');
        const recienCreados = await consultar(
          'SELECT id, nombre, "unidadMedida" FROM "Insumos" WHERE nombre IN (:nombres)',
          { nombres: insumosAInsertar.map((i) => i.nombre) }
        );
        const filasStock = [];
        for (const sucursal of sucursales) {
          for (const insumo of recienCreados) {
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

      const insumos = await cargarInsumos();
      const insumoPorNombre = (nombre) => {
        const insumo = insumos.find((i) => i.nombre === nombre);
        if (!insumo) {
          throw new Error(`Insumo no encontrado: ${nombre}. Corré primero el seeder de hamburguesas (20261015120000)`);
        }
        return insumo;
      };

      // ---------- 2) Hamburguesas, con su receta ----------
      let productos = await cargarProductos();

      // Si se corrió una versión anterior de este seeder, se renombran las hamburguesas y sus combos
      for (const h of HAMBURGUESAS.filter((x) => x.anterior)) {
        const viejas = [
          { de: h.anterior, a: h.nombre, descripcion: h.descripcion },
          {
            de: nombreCombo(h.anterior),
            a: nombreCombo(h.nombre),
            descripcion: `${h.nombre} en versión combo: viene con papas y bebida a elección. Elegí el tamaño del combo y personalizá tu hamburguesa.`,
          },
        ];
        for (const v of viejas) {
          const producto = productos.find((p) => p.nombre === v.de);
          if (!producto || productos.some((p) => p.nombre === v.a)) continue;
          await ejecutar('UPDATE "Productos" SET nombre = :nombre, descripcion = :descripcion, "updatedAt" = NOW() WHERE id = :id', {
            id: producto.id,
            nombre: v.a,
            descripcion: v.descripcion,
          });
        }
      }
      productos = await cargarProductos();
      const nuevas = HAMBURGUESAS.filter((h) => !productos.some((p) => p.nombre === h.nombre));
      if (nuevas.length > 0) {
        await queryInterface.bulkInsert(
          'Productos',
          nuevas.map((h) => ({
            nombre: h.nombre,
            descripcion: h.descripcion,
            precio: h.precio,
            imagen: '',
            disponible: true,
            categoriaId: categoriaHamburguesas,
            createdAt: ahora,
            updatedAt: ahora,
          })),
          { transaction }
        );
      }

      productos = await cargarProductos();
      const idProducto = (nombre) => {
        const producto = productos.find((p) => p.nombre === nombre);
        if (!producto) throw new Error(`Producto no encontrado: ${nombre}`);
        return producto.id;
      };

      for (const h of HAMBURGUESAS) {
        const productoId = idProducto(h.nombre);
        const conReceta = await consultar('SELECT 1 FROM "RecetaInsumos" WHERE "productoId" = :productoId LIMIT 1', { productoId });
        if (conReceta.length > 0) continue;

        await queryInterface.bulkInsert(
          'RecetaInsumos',
          h.receta.map(([nombreInsumo, cantidadBase, removible = false]) => {
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

      // ---------- 3) Un combo por hamburguesa ----------
      const combosNuevos = HAMBURGUESAS.filter((h) => !productos.some((p) => p.nombre === nombreCombo(h.nombre)));
      if (combosNuevos.length > 0) {
        await queryInterface.bulkInsert(
          'Productos',
          combosNuevos.map((h) => ({
            nombre: nombreCombo(h.nombre),
            descripcion: `${h.nombre} en versión combo: viene con papas y bebida a elección. Elegí el tamaño del combo y personalizá tu hamburguesa.`,
            precio: precioCombo(h.precio)[0],
            imagen: '',
            disponible: true,
            categoriaId: categoriaCombos,
            createdAt: ahora,
            updatedAt: ahora,
          })),
          { transaction }
        );
        productos = await cargarProductos();

        // La receta del combo es la de su hamburguesa; las papas y la bebida salen de los grupos elegibles
        for (const h of combosNuevos) {
          await ejecutar(
            `INSERT INTO "RecetaInsumos" ("productoId", "insumoId", "cantidadBase", "esRemovible", "esAgregable", "createdAt", "updatedAt")
             SELECT :comboId, "insumoId", "cantidadBase", "esRemovible", "esAgregable", NOW(), NOW()
               FROM "RecetaInsumos"
              WHERE "productoId" = :hamburguesaId`,
            { comboId: idProducto(nombreCombo(h.nombre)), hamburguesaId: idProducto(h.nombre) }
          );
        }
      }

      // Tamaños con precio de todos los combos
      const tamanios = await consultar('SELECT id, nombre FROM "Tamanios"');
      const idTamanio = (nombre) => {
        const tamanio = tamanios.find((t) => t.nombre === nombre);
        if (!tamanio) throw new Error(`Falta el tamaño "${nombre}": corré primero las migraciones`);
        return tamanio.id;
      };

      for (const h of HAMBURGUESAS) {
        const comboId = idProducto(nombreCombo(h.nombre));
        const precios = precioCombo(h.precio);

        await ejecutar('UPDATE "Productos" SET precio = :precio, "updatedAt" = NOW() WHERE id = :id', {
          id: comboId,
          precio: precios[0],
        });
        await queryInterface.bulkInsert(
          'ProductoTamanios',
          NOMBRES_TAMANIOS.map((nombre, i) => ({
            productoId: comboId,
            tamanioId: idTamanio(nombre),
            precio: precios[i],
            etiqueta: null,
            factorStock: 1,
            createdAt: ahora,
            updatedAt: ahora,
          })),
          { transaction, ignoreDuplicates: true }
        );
        for (const [i, nombre] of NOMBRES_TAMANIOS.entries()) {
          await ejecutar(
            'UPDATE "ProductoTamanios" SET precio = :precio, "updatedAt" = NOW() WHERE "productoId" = :comboId AND "tamanioId" = :tamanioId',
            { precio: precios[i], comboId, tamanioId: idTamanio(nombre) }
          );
        }
      }

      // Grupos elegibles (papas y bebida) de los combos nuevos
      for (const h of combosNuevos) {
        const comboId = idProducto(nombreCombo(h.nombre));
        for (const grupo of GRUPOS_COMBO) {
          await queryInterface.bulkInsert(
            'ComboGrupos',
            [{
              productoId: comboId,
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

      const nombres = HAMBURGUESAS.flatMap((h) => [h.nombre, nombreCombo(h.nombre), ...(h.anterior ? [h.anterior, nombreCombo(h.anterior)] : [])]);
      const creados = await consultar('SELECT id FROM "Productos" WHERE nombre IN (:nombres)', { nombres });
      const ids = creados.map((p) => p.id);
      if (ids.length > 0) {
        await ejecutar('DELETE FROM "ProductoTamanios" WHERE "productoId" IN (:ids)', { ids });
        await ejecutar('DELETE FROM "ComboGrupos" WHERE "productoId" IN (:ids)', { ids });
        await ejecutar('DELETE FROM "RecetaInsumos" WHERE "productoId" IN (:ids)', { ids });
        await ejecutar('DELETE FROM "Productos" WHERE id IN (:ids)', { ids });
      }

      const nombresInsumos = INSUMOS_NUEVOS.map((i) => i.nombre);
      await ejecutar(
        'DELETE FROM "StockSucursals" WHERE "insumoId" IN (SELECT id FROM "Insumos" WHERE nombre IN (:nombres))',
        { nombres: nombresInsumos }
      );
      await ejecutar('DELETE FROM "Insumos" WHERE nombre IN (:nombres)', { nombres: nombresInsumos });
    });
  },
};
