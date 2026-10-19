'use strict';

// Categorías que faltaban: Postres, Ensaladas, Sin TACC, Salsas, Cajita Mágica (nueva),
// y más productos en Nuggets, Papas Fritas y Bebidas.
//
// IMPORTANTE: correr DESPUÉS de los tres seeders anteriores:
//   20261015120000-catalogo-hamburguesas-y-combos.js  (Salsa BBQ, Mayonesa, Salsa picante, Palta)
//   20261015130000-cafeteria-y-desayunos.js            (Leche, Jarabe de vainilla)
//   20261016120000-hamburguesas-especiales.js          (Queso parmesano)
//
// Reglas del catálogo que se respetan acá:
//  - Papas y Bebidas nuevas tienen los 3 tamaños (regular, mediano, grande): sin eso no se podrían elegir dentro de un combo.
//  - Ninguna es más barata que la opción actual de su categoría en cada tamaño (Papas fritas y Agua mineral):
//    la más barata viene incluida en el combo, y si cambiara, cambiaría el recargo de todos los combos.
//  - Las bebidas solo usan los sabores que acepta el sistema (cola, naranja, lima, agua) o ninguno.
//  - No hay bebidas alcohólicas: la Cajita Mágica ofrece toda la categoría Bebidas.
//
// También ajusta recetas de hamburguesas que ya existían (y de sus combos): Pickle Me Fast, Abominación, Fast Cheese
// y Doble Fast Cheese. Se hace acá y no en los seeders anteriores porque algunos insumos (Ajíes asados, Cebolla morada)
// recién existen después del seeder de las especiales, y porque los seeders no modifican una receta que ya existe.
//
// Es re-ejecutable: no duplica nada que ya exista. Los precios están en las constantes de abajo.

const NOMBRES_TAMANIOS = ['regular', 'mediano', 'grande'];

// ---------- Insumos nuevos ----------
// stock: opcional, para los que se gastan más rápido que el valor por defecto de su unidad
const INSUMOS_NUEVOS = [
  // Postres
  { nombre: 'Helado de vainilla', unidadMedida: 'porción', stock: { cantidad: 500, minimo: 100 } },
  { nombre: 'Salsa de chocolate', unidadMedida: 'cucharada' },
  { nombre: 'Salsa de frutilla', unidadMedida: 'cucharada' },
  { nombre: 'Brownie', unidadMedida: 'unidad' },
  { nombre: 'Cheesecake de frutos rojos', unidadMedida: 'porción' },
  { nombre: 'Galletitas trituradas', unidadMedida: 'porción' },
  { nombre: 'Empanadita de manzana', unidadMedida: 'unidad' },
  { nombre: 'Dona glaseada', unidadMedida: 'unidad', stock: { cantidad: 400, minimo: 80 } },
  // Ensaladas
  { nombre: 'Croutons', unidadMedida: 'porción' },
  { nombre: 'Zanahoria', unidadMedida: 'porción', stock: { cantidad: 300, minimo: 60 } },
  { nombre: 'Mozzarella fresca', unidadMedida: 'porción' },
  { nombre: 'Albahaca', unidadMedida: 'hoja' },
  // Sin TACC
  { nombre: 'Pan sin TACC', unidadMedida: 'unidad' },
  { nombre: 'Medallón sin TACC', unidadMedida: 'unidad' },
  { nombre: 'Papas sin TACC', unidadMedida: 'porción' },
  { nombre: 'Nugget sin TACC', unidadMedida: 'unidad', stock: { cantidad: 600, minimo: 120 } },
  { nombre: 'Brownie sin TACC', unidadMedida: 'unidad' },
  // Salsas
  { nombre: 'Ketchup', unidadMedida: 'cucharada', stock: { cantidad: 600, minimo: 120 } },
  { nombre: 'Mostaza', unidadMedida: 'cucharada', stock: { cantidad: 600, minimo: 120 } },
  // Nuggets
  { nombre: 'Nugget de queso', unidadMedida: 'unidad', stock: { cantidad: 600, minimo: 120 } },
  { nombre: 'Nugget picante', unidadMedida: 'unidad', stock: { cantidad: 600, minimo: 120 } },
  // Papas
  { nombre: 'Orégano', unidadMedida: 'cucharada' },
  { nombre: 'Condimento cajún', unidadMedida: 'cucharada' },
  // Bebidas
  { nombre: 'Agua con gas', unidadMedida: 'unidad', stock: { cantidad: 300, minimo: 60 } },
  { nombre: 'Jugo de manzana', unidadMedida: 'unidad', stock: { cantidad: 300, minimo: 60 } },
  { nombre: 'Té helado de durazno', unidadMedida: 'unidad', stock: { cantidad: 300, minimo: 60 } },
  // Abominación y Aros de Cebolla (producto de Nuggets)
  { nombre: 'Aros de cebolla fritos', unidadMedida: 'aro', stock: { cantidad: 800, minimo: 160 } },
  // Cajita Mágica
  { nombre: 'Juguete sorpresa', unidadMedida: 'unidad', stock: { cantidad: 300, minimo: 60 } },
];

// Stock inicial y mínimo por unidad de medida (mismo criterio que los seeders anteriores)
const STOCK_POR_UNIDAD = {
  unidad: { cantidad: 200, minimo: 40 },
  hoja: { cantidad: 400, minimo: 80 },
  aro: { cantidad: 400, minimo: 80 },
  cucharada: { cantidad: 300, minimo: 60 },
  porción: { cantidad: 150, minimo: 30 },
  feta: { cantidad: 300, minimo: 60 },
};

// ---------- Productos simples (un solo precio) ----------
// receta: [insumo, cantidadBase, removible]
const PRODUCTOS_SIMPLES = [
  // --- Postres ---
  {
    categoria: 'Postres', nombre: 'Helado Sundae', precio: 2800,
    descripcion: 'Helado de vainilla cremoso con salsa de chocolate o de frutilla. Clásico, simple y siempre rico.',
    receta: [['Helado de vainilla', 2], ['Salsa de chocolate', 1, true], ['Salsa de frutilla', 1, true]],
  },
  {
    categoria: 'Postres', nombre: 'Brownie con Helado', precio: 3800,
    descripcion: 'Brownie de chocolate tibio con una bocha de helado de vainilla y salsa de chocolate.',
    receta: [['Brownie', 1], ['Helado de vainilla', 1], ['Salsa de chocolate', 1, true]],
  },
  {
    categoria: 'Postres', nombre: 'Cheesecake de Frutos Rojos', precio: 4200,
    descripcion: 'Porción de cheesecake cremoso con salsa de frutos rojos sobre base de galleta.',
    receta: [['Cheesecake de frutos rojos', 1]],
  },
  {
    categoria: 'Postres', nombre: 'Helado Crunch', precio: 3300,
    descripcion: 'Helado de vainilla batido con galletitas trituradas y salsa de chocolate. Cremoso y crocante a la vez.',
    receta: [['Helado de vainilla', 2], ['Galletitas trituradas', 1, true], ['Salsa de chocolate', 1, true]],
  },
  {
    categoria: 'Postres', nombre: 'Tarta de Manzana Frita', precio: 2400,
    descripcion: 'Empanadita frita y crocante rellena de manzana con canela. Para comer con la mano.',
    receta: [['Empanadita de manzana', 1]],
  },
  {
    categoria: 'Postres', nombre: 'Donas Glaseadas x3', precio: 3200,
    descripcion: 'Tres donas esponjosas con glaseado dulce.',
    receta: [['Dona glaseada', 3]],
  },
  // --- Ensaladas ---
  {
    categoria: 'Ensaladas', nombre: 'Ensalada César', precio: 5400,
    descripcion: 'Lechuga fresca con pollo grillado, croutons crocantes y parmesano.',
    receta: [['Lechuga', 3, true], ['Pechuga de pollo', 1], ['Croutons', 1, true], ['Queso parmesano', 1, true]],
  },
  {
    categoria: 'Ensaladas', nombre: 'Ensalada Mixta', precio: 3800,
    descripcion: 'Lechuga, tomate, zanahoria y cebolla. Simple, fresca y liviana.',
    receta: [['Lechuga', 3, true], ['Tomate', 3, true], ['Zanahoria', 2, true], ['Cebolla', 2, true]],
  },
  {
    categoria: 'Ensaladas', nombre: 'Ensalada Caprese', precio: 4800,
    descripcion: 'Tomate maduro con mozzarella fresca y hojas de albahaca.',
    receta: [['Tomate', 4, true], ['Mozzarella fresca', 3, true], ['Albahaca', 4, true]],
  },
  {
    categoria: 'Ensaladas', nombre: 'Ensalada de Pollo y Palta', precio: 6200,
    descripcion: 'Lechuga con pollo grillado, palta cremosa y tomate. Completa y bien fresca.',
    receta: [['Lechuga', 3, true], ['Pechuga de pollo', 1], ['Palta', 3, true], ['Tomate', 2, true]],
  },
  // --- Sin TACC ---
  {
    categoria: 'Sin TACC', nombre: 'Hamburguesa Sin TACC', precio: 6200,
    descripcion: 'Pan apto celíacos y medallón certificado, con queso, lechuga y tomate. Se prepara en un sector aparte.',
    receta: [['Pan sin TACC', 1], ['Medallón sin TACC', 1], ['Queso (feta)', 1, true], ['Lechuga', 2, true], ['Tomate', 2, true]],
  },
  {
    categoria: 'Sin TACC', nombre: 'Papas Sin TACC', precio: 2600,
    descripcion: 'Papas fritas crocantes hechas en una freidora separada, para que sean aptas celíacos.',
    receta: [['Papas sin TACC', 1]],
  },
  {
    categoria: 'Sin TACC', nombre: 'Nuggets Sin TACC x6', precio: 3300,
    descripcion: 'Seis nuggets de pollo sin TACC, preparados aparte y sin contaminación cruzada.',
    receta: [['Nugget sin TACC', 6]],
  },
  {
    categoria: 'Sin TACC', nombre: 'Brownie Sin TACC', precio: 2800,
    descripcion: 'Brownie de chocolate húmedo, apto celíacos.',
    receta: [['Brownie sin TACC', 1]],
  },
  // --- Salsas ---
  {
    categoria: 'Salsas', nombre: 'Ketchup', precio: 500,
    descripcion: 'Porción de ketchup.',
    receta: [['Ketchup', 1]],
  },
  {
    categoria: 'Salsas', nombre: 'Mostaza', precio: 500,
    descripcion: 'Porción de mostaza.',
    receta: [['Mostaza', 1]],
  },
  {
    categoria: 'Salsas', nombre: 'Mayonesa', precio: 500,
    descripcion: 'Porción de mayonesa.',
    receta: [['Mayonesa', 1]],
  },
  {
    categoria: 'Salsas', nombre: 'Salsa Barbacoa', precio: 600,
    descripcion: 'Porción de salsa barbacoa ahumada.',
    receta: [['Salsa BBQ', 1]],
  },
  {
    categoria: 'Salsas', nombre: 'Cheddar Fundido', precio: 700,
    descripcion: 'Porción de salsa cheddar caliente para mojar.',
    receta: [['Salsa cheddar', 1]],
  },
  {
    categoria: 'Salsas', nombre: 'Salsa Picante de la Casa', precio: 600,
    descripcion: 'Porción de nuestra salsa picante. Para los que piden más fuego.',
    receta: [['Salsa picante', 1]],
  },
  // --- Nuggets ---
  {
    categoria: 'Nuggets', nombre: 'Nuggets de Pollo x10', precio: 4100,
    descripcion: 'Diez nuggets de pollo rebozados y crocantes. La porción para compartir.',
    receta: [['Nugget de pollo', 10]],
  },
  {
    categoria: 'Nuggets', nombre: 'Nuggets de Queso x6', precio: 3300,
    descripcion: 'Seis nuggets rebozados con corazón de mozzarella derretida.',
    receta: [['Nugget de queso', 6]],
  },
  {
    categoria: 'Nuggets', nombre: 'Nuggets Picantes x6', precio: 2800,
    descripcion: 'Seis nuggets de pollo con rebozado picante.',
    receta: [['Nugget picante', 6]],
  },
  {
    categoria: 'Nuggets', nombre: 'Aros de Cebolla x8', precio: 3000,
    descripcion: 'Ocho aros de cebolla rebozados y fritos, dorados y crocantes. Para compartir o para picar mientras esperás.',
    receta: [['Aros de cebolla fritos', 8]],
  },
];

// ---------- Papas y Bebidas nuevas (con los 3 tamaños) ----------
// precios y etiquetas: regular / mediano / grande. factores: cuánto insumo gasta cada tamaño.
const MEDIDAS_BEBIDA = ['354 ml', '500 ml', '1 L'];
const FACTORES_BEBIDA = [1, 1.4, 2.8];
const FACTORES_PAPAS = [1, 1.5, 2];

const PRODUCTOS_CON_TAMANIOS = [
  {
    categoria: 'Papas Fritas', nombre: 'Papas Rústicas', sabor: null,
    descripcion: 'Papas cortadas gruesas, con cáscara y orégano.',
    precios: [2100, 2600, 3200], etiquetas: [null, null, null], factores: FACTORES_PAPAS,
    receta: [['Papas fritas', 1], ['Orégano', 1, true]],
  },
  {
    categoria: 'Papas Fritas', nombre: 'Papas Cajún', sabor: null,
    descripcion: 'Papas fritas condimentadas con especias cajún, con un toque picante.',
    precios: [2200, 2700, 3300], etiquetas: [null, null, null], factores: FACTORES_PAPAS,
    receta: [['Papas fritas', 1], ['Condimento cajún', 1, true]],
  },
  {
    categoria: 'Bebidas', nombre: 'Agua con gas', sabor: 'agua',
    descripcion: 'Agua mineral con gas.',
    precios: [1100, 1400, 2000], etiquetas: MEDIDAS_BEBIDA, factores: FACTORES_BEBIDA,
    receta: [['Agua con gas', 1]],
  },
  {
    categoria: 'Bebidas', nombre: 'Jugo de Manzana', sabor: null,
    descripcion: 'Jugo de manzana bien frío.',
    precios: [1500, 1900, 2700], etiquetas: MEDIDAS_BEBIDA, factores: FACTORES_BEBIDA,
    receta: [['Jugo de manzana', 1]],
  },
  {
    categoria: 'Bebidas', nombre: 'Limonada Fresca', sabor: 'lima',
    descripcion: 'Limonada natural con hielo.',
    precios: [1700, 2100, 3000], etiquetas: MEDIDAS_BEBIDA, factores: FACTORES_BEBIDA,
    receta: [['Limonada preparada', 1]],
  },
  {
    categoria: 'Bebidas', nombre: 'Té Helado de Durazno', sabor: null,
    descripcion: 'Té helado con sabor a durazno, dulce y refrescante.',
    precios: [1600, 2000, 2800], etiquetas: MEDIDAS_BEBIDA, factores: FACTORES_BEBIDA,
    receta: [['Té helado de durazno', 1]],
  },
  {
    categoria: 'Bebidas', nombre: 'Batido de Vainilla', sabor: null,
    descripcion: 'Batido cremoso de helado y leche con vainilla.',
    precios: [2600, 3200, 4000], etiquetas: ['300 ml', '450 ml', '650 ml'], factores: [1, 1.5, 2.2],
    receta: [['Leche', 3], ['Helado de vainilla', 1], ['Jarabe de vainilla', 1, true]],
  },
];

// ---------- Cajita Mágica (categoría nueva) ----------
// Una sola fila de tamaño ("regular") y un grupo para elegir la bebida chica; la más barata (agua) viene incluida.
const CATEGORIA_CAJITA = 'Cajita Mágica';
const CAJITAS = [
  {
    nombre: 'Cajita Nuggets y Fritas', precio: 4600,
    descripcion: 'Cuatro nuggets de pollo con papas fritas, bebida chica a elección y un juguete sorpresa.',
    receta: [['Nugget de pollo', 4], ['Papas fritas', 0.5], ['Juguete sorpresa', 1]],
  },
  {
    nombre: 'Cajita Nuggets y Ensalada', precio: 4600,
    descripcion: 'Cuatro nuggets de pollo con ensalada fresca, bebida chica a elección y un juguete sorpresa.',
    receta: [['Nugget de pollo', 4], ['Lechuga', 2, true], ['Tomate', 1, true], ['Zanahoria', 1, true], ['Juguete sorpresa', 1]],
  },
  {
    nombre: 'Cajita Hamburguesa de Queso y Fritas', precio: 5600,
    descripcion: 'Hamburguesa de queso con papas fritas, bebida chica a elección y un juguete sorpresa.',
    receta: [['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 1], ['Queso (feta)', 1, true], ['Papas fritas', 0.5], ['Juguete sorpresa', 1]],
  },
  {
    nombre: 'Cajita Hamburguesa de Queso y Ensalada', precio: 5600,
    descripcion: 'Hamburguesa de queso con ensalada fresca, bebida chica a elección y un juguete sorpresa.',
    receta: [
      ['Pan de hamburguesa', 1], ['Medallón de carne (vacuno)', 1], ['Queso (feta)', 1, true],
      ['Lechuga', 2, true], ['Tomate', 1, true], ['Zanahoria', 1, true], ['Juguete sorpresa', 1],
    ],
  },
];
// ---------- Ajustes a recetas de productos que ya existían ----------
// Cada ajuste se aplica a la hamburguesa y a su combo (el combo tiene su propia receta).
//   quitar: ingredientes que se sacan de la receta.
//   fijar:  [insumo, cantidadBase, removible]: se agrega si falta y, si ya está, se le pone esa cantidad.
//   antes:  cómo era la receta, para poder deshacer el seeder.
const AJUSTES_RECETAS = [
  {
    // Pickle Me Fast: suma lechuga, tomate y ajíes asados
    productos: ['Pickle Me Fast', 'Combo Pickle Me Fast'],
    fijar: [['Lechuga', 1, true], ['Tomate', 1, true], ['Ajíes asados', 2, true]],
    antes: [],
  },
  {
    // Abominación: 3 aros de cebolla fritos, 2 de cebolla morada, lechuga y 2 fetas de cheddar (antes: 3 aros de cebolla)
    productos: ['Abominación', 'Combo Abominación'],
    quitar: ['Cebolla'],
    fijar: [['Aros de cebolla fritos', 3, true], ['Cebolla morada', 2, true], ['Lechuga', 1, true], ['Queso (feta)', 2, true]],
    antes: [['Cebolla', 3, true]],
  },
  {
    // Fast Cheese: cheeseburger pura, sin papas fritas y con 2 fetas de queso (antes: 1)
    productos: ['Fast Cheese', 'Combo Fast Cheese'],
    quitar: ['Papas fritas'],
    fijar: [['Queso (feta)', 2, true]],
    antes: [['Queso (feta)', 1, true]],
  },
  {
    // Doble Fast Cheese: 3 fetas de queso (antes: 1)
    productos: ['Doble Fast Cheese', 'Combo Doble Fast Cheese'],
    fijar: [['Queso (feta)', 3, true]],
    antes: [['Queso (feta)', 1, true]],
  },
];

const GRUPO_CAJITA = { nombre: 'Bebida', categoria: 'Bebidas', incluido: 'Agua mineral', icono: '🥤', orden: 1 };

module.exports = {
  // Para poder revisar los datos sin tocar la base
  _datos: { INSUMOS_NUEVOS, PRODUCTOS_SIMPLES, PRODUCTOS_CON_TAMANIOS, CAJITAS, GRUPO_CAJITA },

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

      const idCategoria = async (nombre) => {
        const [categoria] = await consultar('SELECT id FROM "Categoria" WHERE nombre = :nombre', { nombre });
        if (!categoria) throw new Error(`Falta la categoría "${nombre}": corré primero el seeder de categorías`);
        return categoria.id;
      };

      // La categoría nueva
      const [cajitaExistente] = await consultar('SELECT id FROM "Categoria" WHERE nombre = :nombre', { nombre: CATEGORIA_CAJITA });
      if (!cajitaExistente) {
        await queryInterface.bulkInsert('Categoria', [{ nombre: CATEGORIA_CAJITA, createdAt: ahora, updatedAt: ahora }], { transaction });
      }

      // ---------- 1) Insumos nuevos, con stock en todas las sucursales ----------
      const insumosExistentes = await cargarInsumos();
      const insumosAInsertar = INSUMOS_NUEVOS.filter((i) => !insumosExistentes.some((e) => e.nombre === i.nombre));

      if (insumosAInsertar.length > 0) {
        await queryInterface.bulkInsert(
          'Insumos',
          insumosAInsertar.map(({ nombre, unidadMedida }) => ({
            nombre,
            unidadMedida,
            precioComercial: null,
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
          throw new Error(
            `Insumo no encontrado: ${nombre}. Corré primero los seeders de hamburguesas, cafetería y hamburguesas especiales`
          );
        }
        return insumo;
      };

      // ---------- 2) Productos nuevos ----------
      let productos = await cargarProductos();
      const todos = [
        ...PRODUCTOS_SIMPLES.map((p) => ({ ...p, sabor: null })),
        ...PRODUCTOS_CON_TAMANIOS.map((p) => ({ ...p, precio: p.precios[0] })),
        ...CAJITAS.map((p) => ({ ...p, categoria: CATEGORIA_CAJITA, sabor: null })),
      ];
      const aInsertar = todos.filter((p) => !productos.some((existente) => existente.nombre === p.nombre));

      if (aInsertar.length > 0) {
        const filas = [];
        for (const p of aInsertar) {
          filas.push({
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precio,
            imagen: '',
            disponible: true,
            sabor: p.sabor,
            categoriaId: await idCategoria(p.categoria),
            createdAt: ahora,
            updatedAt: ahora,
          });
        }
        await queryInterface.bulkInsert('Productos', filas, { transaction });
      }

      productos = await cargarProductos();
      const idProducto = (nombre) => {
        const producto = productos.find((p) => p.nombre === nombre);
        if (!producto) throw new Error(`Producto no encontrado: ${nombre}`);
        return producto.id;
      };

      // ---------- 3) Recetas ----------
      for (const p of todos) {
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

      // ---------- 3b) Ajustes a recetas que ya existían ----------
      const fijarIngrediente = async (productoId, nombreInsumo, cantidadBase, removible) => {
        const insumo = insumoPorNombre(nombreInsumo);
        const valores = {
          cantidadBase,
          esRemovible: removible,
          // Se puede pedir de más solo si el insumo tiene precio de venta como extra
          esAgregable: removible && insumo.precioComercial !== null,
        };
        const [existente] = await consultar(
          'SELECT id FROM "RecetaInsumos" WHERE "productoId" = :productoId AND "insumoId" = :insumoId',
          { productoId, insumoId: insumo.id }
        );
        if (existente) {
          await ejecutar(
            'UPDATE "RecetaInsumos" SET "cantidadBase" = :cantidadBase, "esRemovible" = :esRemovible, "esAgregable" = :esAgregable, "updatedAt" = NOW() WHERE id = :id',
            { ...valores, id: existente.id }
          );
        } else {
          await queryInterface.bulkInsert(
            'RecetaInsumos',
            [{ productoId, insumoId: insumo.id, ...valores, createdAt: ahora, updatedAt: ahora }],
            { transaction }
          );
        }
      };

      for (const ajuste of AJUSTES_RECETAS) {
        for (const nombreProducto of ajuste.productos) {
          const producto = productos.find((p) => p.nombre === nombreProducto);
          if (!producto) continue;

          for (const nombreInsumo of ajuste.quitar ?? []) {
            await ejecutar(
              'DELETE FROM "RecetaInsumos" WHERE "productoId" = :productoId AND "insumoId" IN (SELECT id FROM "Insumos" WHERE nombre = :nombre)',
              { productoId: producto.id, nombre: nombreInsumo }
            );
          }
          for (const [nombreInsumo, cantidadBase, removible = false] of ajuste.fijar) {
            await fijarIngrediente(producto.id, nombreInsumo, cantidadBase, removible);
          }
        }
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
      for (const p of PRODUCTOS_CON_TAMANIOS) {
        NOMBRES_TAMANIOS.forEach((tamanio, i) =>
          filasTamanios.push([idProducto(p.nombre), tamanio, p.precios[i], p.etiquetas[i], p.factores[i]])
        );
      }
      // Cajitas: una sola fila "regular", para que la bebida chica se pueda elegir dentro del grupo
      for (const c of CAJITAS) {
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

      // ---------- 5) Grupo elegible (bebida) de las cajitas ----------
      for (const c of CAJITAS) {
        const productoId = idProducto(c.nombre);
        const conGrupos = await consultar('SELECT 1 FROM "ComboGrupos" WHERE "productoId" = :productoId LIMIT 1', { productoId });
        if (conGrupos.length > 0) continue;

        await queryInterface.bulkInsert(
          'ComboGrupos',
          [{
            productoId,
            nombre: GRUPO_CAJITA.nombre,
            categoriaId: await idCategoria(GRUPO_CAJITA.categoria),
            productoIncluidoId: idProducto(GRUPO_CAJITA.incluido),
            obligatorio: true,
            orden: GRUPO_CAJITA.orden,
            icono: GRUPO_CAJITA.icono,
            createdAt: ahora,
            updatedAt: ahora,
          }],
          { transaction }
        );
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

      const nombres = [...PRODUCTOS_SIMPLES, ...PRODUCTOS_CON_TAMANIOS, ...CAJITAS].map((p) => p.nombre);
      const creados = await consultar('SELECT id FROM "Productos" WHERE nombre IN (:nombres)', { nombres });
      const ids = creados.map((p) => p.id);
      if (ids.length > 0) {
        await ejecutar('DELETE FROM "ComboGrupos" WHERE "productoId" IN (:ids)', { ids });
        await ejecutar('DELETE FROM "ProductoTamanios" WHERE "productoId" IN (:ids)', { ids });
        await ejecutar('DELETE FROM "RecetaInsumos" WHERE "productoId" IN (:ids)', { ids });
        await ejecutar('DELETE FROM "Productos" WHERE id IN (:ids)', { ids });
      }

      // Las recetas ajustadas vuelven a como eran: se sacan los ingredientes que se sumaron y se restauran los anteriores
      // (las papas que se le sacaron a Fast Cheese no se restauran: ya las había sacado el seeder de hamburguesas)
      for (const ajuste of AJUSTES_RECETAS) {
        const previos = ajuste.antes.map(([nombre]) => nombre);
        const sumados = ajuste.fijar.map(([nombre]) => nombre).filter((nombre) => !previos.includes(nombre));

        if (sumados.length > 0) {
          await ejecutar(
            `DELETE FROM "RecetaInsumos"
              WHERE "productoId" IN (SELECT id FROM "Productos" WHERE nombre IN (:productos))
                AND "insumoId" IN (SELECT id FROM "Insumos" WHERE nombre IN (:insumos))`,
            { productos: ajuste.productos, insumos: sumados }
          );
        }
        for (const [nombreInsumo, cantidadBase, removible] of ajuste.antes) {
          await ejecutar(
            `INSERT INTO "RecetaInsumos" ("productoId", "insumoId", "cantidadBase", "esRemovible", "esAgregable", "createdAt", "updatedAt")
             SELECT p.id, i.id, :cantidadBase, :removible, (:removible AND i."precioComercial" IS NOT NULL), NOW(), NOW()
               FROM "Productos" p CROSS JOIN "Insumos" i
              WHERE p.nombre IN (:productos) AND p."deletedAt" IS NULL AND i.nombre = :insumo
                AND NOT EXISTS (SELECT 1 FROM "RecetaInsumos" r WHERE r."productoId" = p.id AND r."insumoId" = i.id)`,
            { productos: ajuste.productos, insumo: nombreInsumo, cantidadBase, removible }
          );
          await ejecutar(
            `UPDATE "RecetaInsumos" SET "cantidadBase" = :cantidadBase, "updatedAt" = NOW()
              WHERE "productoId" IN (SELECT id FROM "Productos" WHERE nombre IN (:productos))
                AND "insumoId" IN (SELECT id FROM "Insumos" WHERE nombre = :insumo)`,
            { productos: ajuste.productos, insumo: nombreInsumo, cantidadBase }
          );
        }
      }

      // La categoría nueva se borra solo si quedó vacía
      await ejecutar(
        'DELETE FROM "Categoria" WHERE nombre = :nombre AND NOT EXISTS (SELECT 1 FROM "Productos" WHERE "categoriaId" = "Categoria".id)',
        { nombre: CATEGORIA_CAJITA }
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
