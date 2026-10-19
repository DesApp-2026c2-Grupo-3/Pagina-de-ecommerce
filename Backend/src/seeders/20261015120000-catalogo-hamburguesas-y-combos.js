'use strict';

// Catálogo ampliado de hamburguesas y combos, sobre lo que ya hay en la base (no hace falta resetearla).
//
//  1) Insumos nuevos (queso azul, huevo, palta, etc.) con su stock en todas las sucursales.
//  2) Las 6 hamburguesas actuales se renombran y se les corrige el precio.
//     "Hamburguesa Queso" pasa a ser Fast Cheese, una cheeseburger pura: se le saca la porción de papas.
//  3) 12 hamburguesas nuevas, cada una con su receta.
//  4) Los combos actuales se renombran, y se crea un combo por cada hamburguesa que aún no tiene el suyo.
//     El "Duo Carnivoro" se retira del catálogo (borrado lógico: los pedidos viejos conservan su historial).
//     Todos con tamaños (regular, mediano, grande) y grupos elegibles de acompañamiento y bebida.
//
// Es re-ejecutable: no duplica nada que ya exista. Los precios están todos en las constantes de abajo.

// ---------- Precios de combos: hamburguesa + papas + bebida, con un pequeño ahorro ----------
const SUMA_COMBO_POR_TAMANIO = [2500, 3500, 4800]; // regular, mediano, grande (sobre el precio de la hamburguesa)
const NOMBRES_TAMANIOS = ['regular', 'mediano', 'grande'];
const precioCombo = (precioHamburguesa) => SUMA_COMBO_POR_TAMANIO.map((suma) => precioHamburguesa + suma);

// ---------- Insumos nuevos ----------
// precioComercial: lo que se cobra por cada unidad extra (null = no se puede pedir de más)
const INSUMOS_NUEVOS = [
  { nombre: 'Queso azul', unidadMedida: 'feta', precioComercial: 600 },
  { nombre: 'Huevo', unidadMedida: 'unidad', precioComercial: 400 },
  { nombre: 'Champiñones salteados', unidadMedida: 'porción', precioComercial: 500 },
  { nombre: 'Jalapeños', unidadMedida: 'rodaja', precioComercial: 300 },
  { nombre: 'Palta', unidadMedida: 'rodaja', precioComercial: 700 },
  { nombre: 'Cebolla crispy', unidadMedida: 'porción', precioComercial: 400 },
  { nombre: 'Cebolla caramelizada', unidadMedida: 'porción', precioComercial: null },
  { nombre: 'Rúcula', unidadMedida: 'hoja', precioComercial: null },
  { nombre: 'Salsa ranch', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Salsa picante', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Salsa BBQ', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Mayonesa', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Mayonesa de ajo', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Medallón de legumbres', unidadMedida: 'unidad', precioComercial: null },
  { nombre: 'Provoleta', unidadMedida: 'feta', precioComercial: 600 },
  { nombre: 'Chimichurri', unidadMedida: 'cucharada', precioComercial: null },
  { nombre: 'Entraña desmechada', unidadMedida: 'porción', precioComercial: null },
];

// Stock inicial y mínimo por unidad de medida (mismo criterio que el seeder de stock original)
const STOCK_POR_UNIDAD = {
  unidad: { cantidad: 200, minimo: 40 },
  hoja: { cantidad: 400, minimo: 80 },
  rodaja: { cantidad: 400, minimo: 80 },
  aro: { cantidad: 400, minimo: 80 },
  tira: { cantidad: 250, minimo: 50 },
  cucharada: { cantidad: 300, minimo: 60 },
  porción: { cantidad: 150, minimo: 30 },
  feta: { cantidad: 300, minimo: 60 },
};

// ---------- Hamburguesas existentes: se renombran y se les ajusta el precio ----------
const DESCRIPCION_QUESO_ANTERIOR =
  'Jugosa hamburguesa con queso derretido y crujientes papas fritas en su interior. Una combinación contundente y deliciosa que lleva el clásico acompañamiento directamente dentro de cada mordida.';

const HAMBURGUESAS_RENOMBRADAS = [
  { anterior: 'Hamburguesa Gourmet', nombre: 'Fast Classic', precio: 5200, precioAnterior: 5200 },
  {
    anterior: 'Hamburguesa Queso',
    nombre: 'Fast Cheese',
    precio: 5600,
    precioAnterior: 5200,
    descripcion:
      'La cheeseburger de siempre: jugoso medallón de carne con una feta de cheddar derretido en pan blando. Simple, directa y sin vueltas.',
    descripcionAnterior: DESCRIPCION_QUESO_ANTERIOR,
  },
  { anterior: 'Hamburguesa Cebolla', nombre: 'Fast & Onion', precio: 5900, precioAnterior: 6900 },
  { anterior: 'Hamburguesa Bacon', nombre: 'Habemus Bacon', precio: 7400, precioAnterior: 8200 },
  { anterior: 'Hamburguesa Doble', nombre: 'Doble Fast Cheese', precio: 8200, precioAnterior: 16500 },
  { anterior: 'Hamburguesa Abominacion', nombre: 'Abominación', precio: 6300, precioAnterior: 5200 },
];

// ---------- Hamburguesas nuevas ----------
// receta: [insumo, cantidadBase, removible]. Pan y carne nunca son removibles ni agregables.
const HAMBURGUESAS_NUEVAS = [
  {
    nombre: 'Pickle Me Fast',
    precio: 7000,
    imagen: '/imagenes/Hamburguesas/Pickle-Me.png',
    descripcion: 'Carne jugosa con panceta crocante y frescos pepinos. El salado intenso del bacon con un toque ácido que despierta el paladar.',
    receta: [['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 1], ['Panceta (bacon)', 3, true], ['Pepino', 3, true],]
  },
  {
    nombre: 'Criolla Parrillera',
    precio: 8500,
    descripcion: 'Entraña desmechada, tierna y jugosa, con provoleta grillada, chimichurri casero y tomate. El sabor de la parrilla argentina en pan blando.',
    imagen: '/imagenes/Hamburguesas/Criolla-Parrillera.png',
    receta: [
      ['Pan de hamburguesa', 1], ['Entraña desmechada', 1], ['Provoleta', 1, true],
      ['Chimichurri', 1, true], ['Tomate', 2, true],
    ],
  },
  {
    nombre: 'Modo Bestia',
    precio: 9800,
    descripcion: 'Doble carne, panceta crocante, cheddar derretido, huevo a la plancha y un toque de salsa picante. Para cuando el hambre es en serio.',
    imagen: '/imagenes/Hamburguesas/Modo-Bestia.png',
    receta: [
      ['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 2], ['Queso (feta)', 1, true],
      ['Panceta (bacon)', 2, true], ['Huevo', 1, true], ['Salsa picante', 1, true],
    ],
  },
  {
    nombre: 'Crack Crispy',
    precio: 6400,
    descripcion: 'Pechuga de pollo rebozada y crocante, lechuga fresca y mayonesa suave. Crujiente por fuera, tierna por dentro.',
    imagen: '/imagenes/Hamburguesas/Crack-Crispy.png',
    receta: [['Pan de hamburguesa', 1], ['Pechuga de pollo', 1], ['Lechuga', 2, true], ['Mayonesa', 1, true]],
  },
  {
    nombre: 'Verde que te Quiero Verde',
    precio: 6000,
    descripcion: 'Medallón de legumbres, rúcula fresca, tomate y mayonesa suave. La opción vegetariana, con mucho sabor.',
    imagen: '/imagenes/Hamburguesas/Verde.png',
    receta: [
      ['Pan de hamburguesa', 1], ['Medallón de legumbres', 1], ['Rúcula', 2, true],
      ['Tomate', 2, true], ['Mayonesa', 1, true],
    ],
  },
  {
    nombre: 'Fast Egg',
    precio: 7300,
    descripcion: 'Carne, huevo a la plancha, cheddar y panceta crocante. Estilo "a caballo", con la yema como salsa.',
    imagen: '/imagenes/Hamburguesas/Fast-Egg.png',
    receta: [
      ['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 1], ['Huevo', 1, true],
      ['Queso (feta)', 1, true], ['Panceta (bacon)', 2, true],
    ],
  },
  {
    nombre: 'Doble Habemus',
    precio: 10200,
    descripcion: 'La versión doble de la Habemus Bacon: dos carnes, panceta de sobra y salsa BBQ ahumada.',
    imagen: '/imagenes/Hamburguesas/Habemus-Fast-Doble.png',
    receta: [['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 2], ['Panceta (bacon)', 6, true], ['Salsa BBQ', 1, true]],
  },
  {
    nombre: 'Fast Mushroom',
    precio: 7000,
    descripcion: 'Carne con champiñones salteados, cheddar derretido y mayonesa de ajo. Un sabor terroso y bien casero.',
    imagen: '/imagenes/Hamburguesas/Fast-Mushroom.png',
    receta: [
      ['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 1], ['Champiñones salteados', 1, true],
      ['Queso (feta)', 1, true], ['Mayonesa de ajo', 1, true],
    ],
  },
  {
    nombre: 'Picante Express',
    precio: 6800,
    descripcion: 'Carne con jalapeños, cheddar derretido y nuestra salsa picante. Para los que piden un poco más de fuego.',
    imagen: '/imagenes/Hamburguesas/Picante-Express.png',
    receta: [
      ['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 1], ['Jalapeños', 4, true],
      ['Queso (feta)', 1, true], ['Salsa picante', 1, true],
    ],
  },
  {
    nombre: 'Fast Ranch',
    precio: 6600,
    descripcion: 'Pollo crispy con lechuga, tomate y salsa ranch cremosa. Fresca, crocante y liviana.',
    imagen: '/imagenes/Hamburguesas/Fast-Ranch.png',
     receta: [
      ['Pan de hamburguesa', 1], ['Pechuga de pollo', 1], ['Lechuga', 2, true],
      ['Tomate', 2, true], ['Salsa ranch', 1, true],
    ],
  },
  {
    nombre: 'Palta Power',
    precio: 7100,
    descripcion: 'Carne con palta cremosa, tomate y rúcula. La opción más fresca y liviana del menú.',
    imagen: '/imagenes/Hamburguesas/Palta-Power.png',
    receta: [
      ['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 1], ['Palta', 3, true],
      ['Tomate', 2, true], ['Rúcula', 2, true],
    ],
  },
  {
    nombre: 'Magnum Fast',
    precio: 11900,
    descripcion: 'Triple carne, triple cheddar, panceta crocante y cebolla crispy. La más contundente de la casa, solo para valientes.',
    imagen: '/imagenes/Hamburguesas/Magnum-Fast.png',
    receta: [
      ['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 3], ['Queso (feta)', 3, true],
      ['Panceta (bacon)', 3, true], ['Cebolla crispy', 1, true],
    ],
  },
  {
    nombre: 'Blue Fast',
    precio: 7600,
    descripcion: 'Carne con queso azul fundido, cebolla caramelizada y rúcula. Sabor intenso para quienes buscan algo distinto.',
    imagen: '/imagenes/Hamburguesas/Blue-Fast.png',
    receta: [
      ['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 1], ['Queso azul', 1, true],
      ['Cebolla caramelizada', 1, true], ['Rúcula', 2, true],
    ],
  },
];

// ---------- Combos existentes: se renombran ----------
// hamburguesa: con ella se recalculan los precios por tamaño.
const COMBOS_RENOMBRADOS = [
  { anterior: 'Hamburguesa con papas', nombre: 'Combo Fast Cheese', hamburguesa: 'Fast Cheese', preciosAnteriores: [7500, 8500, 9800] },
  { anterior: 'Bacon Brutal', nombre: 'Combo Habemus Bacon', hamburguesa: 'Habemus Bacon', preciosAnteriores: [11900, 13000, 14300] },
  { anterior: 'Bacon & Pickles', nombre: 'Combo Pickle Me Fast', hamburguesa: 'Pickle Me Fast', preciosAnteriores: [10900, 12000, 13300] },
];
// "La Bestialidad" no se toca: ya es un combo con nombre propio.

// Grupos elegibles de todo combo (igual que en el seeder de combos original)
const GRUPOS_COMBO = [
  { nombre: 'Acompañamiento', categoria: 'Papas Fritas', incluido: 'Papas fritas', icono: '🍟', orden: 1 },
  { nombre: 'Una bebida', categoria: 'Bebidas', incluido: 'Coca Cola', icono: '🥤', orden: 2 },
];

// Se retiran del catálogo con borrado lógico (los pedidos viejos que los incluyen siguen intactos).
// Los demás nombres cubren el caso de haber corrido una versión anterior de este seeder.
const PRODUCTOS_RETIRADOS = ['Duo Carnivoro', 'Combo Dúo Dinámico', 'Dúo Dinámico', 'Provo Loco', 'Combo Provo Loco'];

// La categoría pasa de "Hamburguesa" a "Hamburguesas". Se acepta cualquiera de los dos nombres,
// así funciona antes y después del renombre.
const CATEGORIA_HAMBURGUESAS = ['Hamburguesas', 'Hamburguesa'];
const CATEGORIA_COMBOS = 'Combos';

// Todas las hamburguesas del catálogo y su precio
const PRECIOS_HAMBURGUESAS = Object.fromEntries(
  [...HAMBURGUESAS_RENOMBRADAS, ...HAMBURGUESAS_NUEVAS].map((h) => [h.nombre, h.precio])
);
const nombreCombo = (hamburguesa) => `Combo ${hamburguesa}`;

module.exports = {
  // Para poder revisar los datos sin tocar la base
  _datos: { INSUMOS_NUEVOS, HAMBURGUESAS_RENOMBRADAS, HAMBURGUESAS_NUEVAS, COMBOS_RENOMBRADOS, PRECIOS_HAMBURGUESAS },

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

      // "Hamburguesa" pasa a llamarse "Hamburguesas" (si la base todavía tiene el singular).
      // Este cambio no se revierte en el down: depende de cómo esté el seeder de categorías.
      await ejecutar(
        `UPDATE "Categoria" SET nombre = 'Hamburguesas', "updatedAt" = NOW()
          WHERE nombre = 'Hamburguesa'
            AND NOT EXISTS (SELECT 1 FROM "Categoria" WHERE nombre = 'Hamburguesas')`
      );
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
        if (!insumo) throw new Error(`Insumo no encontrado: ${nombre}`);
        return insumo;
      };

      // ---------- 2) Retirar productos que salen del catálogo ----------
      for (const nombre of PRODUCTOS_RETIRADOS) {
        await ejecutar(
          'UPDATE "Productos" SET "deletedAt" = NOW(), "updatedAt" = NOW() WHERE nombre = :nombre AND "deletedAt" IS NULL',
          { nombre }
        );
      }

      // ---------- 2b) Hamburguesas existentes: renombrar y ajustar precio ----------
      let productos = await cargarProductos();

      for (const h of HAMBURGUESAS_RENOMBRADAS) {
        const producto = productos.find((p) => p.nombre === h.nombre) ?? productos.find((p) => p.nombre === h.anterior);
        if (!producto) continue;

        await ejecutar(
          `UPDATE "Productos"
              SET nombre = :nombre, precio = :precio, descripcion = COALESCE(:descripcion, descripcion), "updatedAt" = NOW()
            WHERE id = :id`,
          { id: producto.id, nombre: h.nombre, precio: h.precio, descripcion: h.descripcion ?? null }
        );
      }

      // Fast Cheese es una cheeseburger pura: sin papas dentro de la hamburguesa
      productos = await cargarProductos();
      const fastCheese = productos.find((p) => p.nombre === 'Fast Cheese');
      if (fastCheese) {
        await ejecutar('DELETE FROM "RecetaInsumos" WHERE "productoId" = :productoId AND "insumoId" = :insumoId', {
          productoId: fastCheese.id,
          insumoId: insumoPorNombre('Papas fritas').id,
        });
      }

      // ---------- 3) Hamburguesas nuevas, con su receta ----------
      const nuevas = HAMBURGUESAS_NUEVAS.filter((h) => !productos.some((p) => p.nombre === h.nombre));
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

      for (const h of HAMBURGUESAS_NUEVAS) {
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

      // ---------- 4) Combos ----------
      // 4a) Renombrar los combos existentes
      for (const c of COMBOS_RENOMBRADOS) {
        const producto = productos.find((p) => p.nombre === c.nombre) ?? productos.find((p) => p.nombre === c.anterior);
        if (!producto) continue;
        await ejecutar('UPDATE "Productos" SET nombre = :nombre, "updatedAt" = NOW() WHERE id = :id', {
          id: producto.id,
          nombre: c.nombre,
        });
      }
      productos = await cargarProductos();

      // 4b) Un combo por cada hamburguesa que todavía no tiene el suyo
      const combosDefinidos = [
        ...COMBOS_RENOMBRADOS.filter((c) => c.hamburguesa).map((c) => ({ nombre: c.nombre, hamburguesa: c.hamburguesa })),
      ];
      for (const nombreHamburguesa of Object.keys(PRECIOS_HAMBURGUESAS)) {
        if (!combosDefinidos.some((c) => c.hamburguesa === nombreHamburguesa)) {
          combosDefinidos.push({ nombre: nombreCombo(nombreHamburguesa), hamburguesa: nombreHamburguesa });
        }
      }

      const combosNuevos = combosDefinidos.filter((c) => !productos.some((p) => p.nombre === c.nombre));
      if (combosNuevos.length > 0) {
        await queryInterface.bulkInsert(
          'Productos',
          combosNuevos.map((c) => ({
            nombre: c.nombre,
            descripcion: `${c.hamburguesa} en versión combo: viene con papas y bebida a elección. Elegí el tamaño del combo y personalizá tu hamburguesa.`,
            precio: precioCombo(PRECIOS_HAMBURGUESAS[c.hamburguesa])[0],
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
        for (const c of combosNuevos) {
          const comboId = idProducto(c.nombre);
          const hamburguesaId = idProducto(c.hamburguesa);
          await ejecutar(
            `INSERT INTO "RecetaInsumos" ("productoId", "insumoId", "cantidadBase", "esRemovible", "esAgregable", "createdAt", "updatedAt")
             SELECT :comboId, "insumoId", "cantidadBase", "esRemovible", "esAgregable", NOW(), NOW()
               FROM "RecetaInsumos"
              WHERE "productoId" = :hamburguesaId`,
            { comboId, hamburguesaId }
          );
        }
      }

      // 4c) Tamaños con precio y grupos elegibles de todos los combos del catálogo
      const tamanios = await consultar('SELECT id, nombre FROM "Tamanios"');
      const idTamanio = (nombre) => {
        const tamanio = tamanios.find((t) => t.nombre === nombre);
        if (!tamanio) throw new Error(`Falta el tamaño "${nombre}": corré primero las migraciones`);
        return tamanio.id;
      };

      for (const c of combosDefinidos) {
        const comboId = idProducto(c.nombre);
        const precios = precioCombo(PRECIOS_HAMBURGUESAS[c.hamburguesa]);

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

      // Los grupos de los combos nuevos (los renombrados y el resto ya los tienen)
      for (const c of combosNuevos) {
        const comboId = idProducto(c.nombre);
        for (const grupo of GRUPOS_COMBO) {
          const categoriaId = await idCategoria(grupo.categoria);
          await queryInterface.bulkInsert(
            'ComboGrupos',
            [{
              productoId: comboId,
              nombre: grupo.nombre,
              categoriaId,
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

      // El Duo Carnivoro vuelve al catálogo
      await ejecutar('UPDATE "Productos" SET "deletedAt" = NULL, "updatedAt" = NOW() WHERE nombre = :nombre', {
        nombre: 'Duo Carnivoro',
      });

      // Combos y hamburguesas creados por este seeder
      const nombresRenombrados = new Set([
        ...HAMBURGUESAS_RENOMBRADAS.map((h) => h.nombre),
        ...COMBOS_RENOMBRADOS.map((c) => c.nombre),
      ]);
      const nombresCreados = [
        ...HAMBURGUESAS_NUEVAS.map((h) => h.nombre),
        ...Object.keys(PRECIOS_HAMBURGUESAS).map(nombreCombo),
      ].filter((nombre) => !nombresRenombrados.has(nombre));

      const creados = await consultar('SELECT id FROM "Productos" WHERE nombre IN (:nombres)', { nombres: nombresCreados });
      const idsCreados = creados.map((p) => p.id);
      if (idsCreados.length > 0) {
        await ejecutar('DELETE FROM "ProductoTamanios" WHERE "productoId" IN (:ids)', { ids: idsCreados });
        await ejecutar('DELETE FROM "ComboGrupos" WHERE "productoId" IN (:ids)', { ids: idsCreados });
        await ejecutar('DELETE FROM "RecetaInsumos" WHERE "productoId" IN (:ids)', { ids: idsCreados });
        await ejecutar('DELETE FROM "Productos" WHERE id IN (:ids)', { ids: idsCreados });
      }

      // Combos renombrados: nombre y precios por tamaño anteriores
      const tamanios = await consultar('SELECT id, nombre FROM "Tamanios"');
      for (const c of COMBOS_RENOMBRADOS) {
        const [combo] = await consultar('SELECT id FROM "Productos" WHERE nombre = :nombre', { nombre: c.nombre });
        if (!combo) continue;
        await ejecutar('UPDATE "Productos" SET nombre = :anterior, "updatedAt" = NOW() WHERE id = :id', { id: combo.id, anterior: c.anterior });

        if (c.preciosAnteriores) {
          await ejecutar('UPDATE "Productos" SET precio = :precio WHERE id = :id', { id: combo.id, precio: c.preciosAnteriores[0] });
          for (const [i, nombre] of NOMBRES_TAMANIOS.entries()) {
            const tamanio = tamanios.find((t) => t.nombre === nombre);
            await ejecutar(
              'UPDATE "ProductoTamanios" SET precio = :precio WHERE "productoId" = :productoId AND "tamanioId" = :tamanioId',
              { precio: c.preciosAnteriores[i], productoId: combo.id, tamanioId: tamanio.id }
            );
          }
        }
      }

      // Hamburguesas renombradas: nombre, precio y descripción anteriores
      for (const h of HAMBURGUESAS_RENOMBRADAS) {
        await ejecutar(
          `UPDATE "Productos"
              SET nombre = :anterior, precio = :precio, descripcion = COALESCE(:descripcion, descripcion), "updatedAt" = NOW()
            WHERE nombre = :nombre`,
          { anterior: h.anterior, nombre: h.nombre, precio: h.precioAnterior, descripcion: h.descripcionAnterior ?? null }
        );
      }

      // Hamburguesa Queso vuelve a traer su media porción de papas
      const [queso] = await consultar('SELECT id FROM "Productos" WHERE nombre = :nombre', { nombre: 'Hamburguesa Queso' });
      const [papas] = await consultar('SELECT id FROM "Insumos" WHERE nombre = :nombre', { nombre: 'Papas fritas' });
      if (queso && papas) {
        const yaEsta = await consultar(
          'SELECT 1 FROM "RecetaInsumos" WHERE "productoId" = :productoId AND "insumoId" = :insumoId',
          { productoId: queso.id, insumoId: papas.id }
        );
        if (yaEsta.length === 0) {
          await queryInterface.bulkInsert(
            'RecetaInsumos',
            [{
              productoId: queso.id,
              insumoId: papas.id,
              cantidadBase: 0.5,
              esRemovible: true,
              esAgregable: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }],
            { transaction }
          );
        }
      }

      // Insumos nuevos y su stock
      const nombresInsumos = INSUMOS_NUEVOS.map((i) => i.nombre);
      await ejecutar(
        'DELETE FROM "StockSucursals" WHERE "insumoId" IN (SELECT id FROM "Insumos" WHERE nombre IN (:nombres))',
        { nombres: nombresInsumos }
      );
      await ejecutar('DELETE FROM "Insumos" WHERE nombre IN (:nombres)', { nombres: nombresInsumos });
    });
  },
};
