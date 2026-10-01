'use strict';

const PAPAS = 'Papas Fritas';
const BEBIDAS = 'Bebidas';

// Precios por tamaño; las bebidas llevan además la medida para mostrar
function tamanios([regular, mediano, grande], etiquetas = [null, null, null]) {
  return [
    { tamanio: 'regular', precio: regular, etiqueta: etiquetas[0] },
    { tamanio: 'mediano', precio: mediano, etiqueta: etiquetas[1] },
    { tamanio: 'grande', precio: grande, etiqueta: etiquetas[2] },
  ];
}
const MEDIDAS = ['354 ml', '500 ml', '1 L'];

const PRODUCTOS = [
  {
    categoria: PAPAS,
    nombre: 'Papas fritas',
    nombreAnterior: 'Papas Medianas',
    descripcion: 'Papas fritas crujientes con sal.',
    imagen: '/imagenes/PapasF.png',
    sabor: null,
    variantes: tamanios([1700, 2100, 2600]),
  },
  {
    categoria: PAPAS,
    nombre: 'Papas con cheddar',
    descripcion: 'Papas fritas bañadas en cheddar fundido.',
    imagen: '/imagenes/PapasF.png',
    sabor: null,
    variantes: tamanios([2400, 2900, 3500]),
  },
  {
    categoria: PAPAS,
    nombre: 'Papas con cheddar y bacon',
    descripcion: 'Papas fritas con cheddar fundido y bacon crocante.',
    imagen: '/imagenes/PapasF.png',
    sabor: null,
    variantes: tamanios([3000, 3600, 4300]),
  },
  {
    categoria: BEBIDAS,
    nombre: 'Coca Cola',
    nombreAnterior: 'Coca Cola 500ml',
    descripcion: 'Bebida gaseosa helada.',
    imagen: '/imagenes/coca-cola.png',
    sabor: 'cola',
    variantes: tamanios([1400, 1800, 2600], MEDIDAS),
  },
  {
    categoria: BEBIDAS,
    nombre: 'Gaseosa Naranja',
    descripcion: 'Gaseosa sabor naranja helada.',
    imagen: '',
    sabor: 'naranja',
    variantes: tamanios([1400, 1800, 2600], MEDIDAS),
  },
  {
    categoria: BEBIDAS,
    nombre: 'Lima-Limón',
    nombreAnterior: 'Limonada',
    descripcion: 'Gaseosa lima-limón helada.',
    imagen: '/imagenes/limonada.png',
    sabor: 'lima',
    variantes: tamanios([1400, 1800, 2600], MEDIDAS),
  },
  {
    categoria: BEBIDAS,
    nombre: 'Agua mineral',
    descripcion: 'Agua mineral sin gas.',
    imagen: '',
    sabor: 'agua',
    variantes: tamanios([1100, 1400, 2000], MEDIDAS),
  },
];

// Cómo eran los productos reutilizados, para poder deshacer el seeder
const ORIGINALES = {
  'Papas fritas': { nombre: 'Papas Medianas', descripcion: 'Papas fritas crujientes con sal.', precio: 2100, sabor: null },
  'Coca Cola': { nombre: 'Coca Cola 500ml', descripcion: 'Bebida gaseosa helada.', precio: 1800, sabor: null },
  'Lima-Limón': { nombre: 'Limonada', descripcion: 'Limonada natural con hielo.', precio: 2000, sabor: null },
};

module.exports = {
  async up(queryInterface) {
    const [categorias] = await queryInterface.sequelize.query(
      'SELECT id, nombre FROM "Categoria" WHERE nombre IN (:nombres)',
      { replacements: { nombres: [PAPAS, BEBIDAS] } }
    );
    const idCategoria = Object.fromEntries(categorias.map((c) => [c.nombre, c.id]));

    if (!idCategoria[PAPAS] || !idCategoria[BEBIDAS]) {
      throw new Error(`Faltan las categorías "${PAPAS}" o "${BEBIDAS}": corré primero el seeder de categorías`);
    }

    await queryInterface.sequelize.transaction(async (transaction) => {
      const ahora = new Date();

      for (const p of PRODUCTOS) {
        const datos = {
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: p.variantes[0].precio, // el precio "desde" es el del tamaño regular
          imagen: p.imagen,
          sabor: p.sabor,
          categoriaId: idCategoria[p.categoria],
        };

        // 1. ¿Ya existe? (con su nombre nuevo o con el anterior)
        const [encontrados] = await queryInterface.sequelize.query(
          'SELECT id FROM "Productos" WHERE nombre IN (:nombres) ORDER BY id LIMIT 1',
          { replacements: { nombres: [p.nombre, p.nombreAnterior ?? p.nombre] }, transaction }
        );

        let productoId;
        if (encontrados.length > 0) {
          productoId = encontrados[0].id;
          await queryInterface.bulkUpdate(
            'Productos',
            { ...datos, updatedAt: ahora },
            { id: productoId },
            { transaction }
          );
        } else {
          const [insertados] = await queryInterface.sequelize.query(
            `INSERT INTO "Productos" (nombre, descripcion, precio, imagen, disponible, sabor, "categoriaId", "createdAt", "updatedAt")
             VALUES (:nombre, :descripcion, :precio, :imagen, true, :sabor, :categoriaId, :ahora, :ahora)
             RETURNING id`,
            { replacements: { ...datos, ahora }, transaction }
          );
          productoId = insertados[0].id;
        }

        // 2. Sus variantes (si ya existen, no se duplican)
        await queryInterface.bulkInsert(
          'ProductoVariantes',
          p.variantes.map((v) => ({
            productoId,
            tamanio: v.tamanio,
            precio: v.precio,
            etiqueta: v.etiqueta,
            createdAt: ahora,
            updatedAt: ahora,
          })),
          { transaction, ignoreDuplicates: true }
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    const nombres = PRODUCTOS.map((p) => p.nombre);
    const reutilizados = Object.keys(ORIGINALES);

    await queryInterface.sequelize.transaction(async (transaction) => {
      // Las variantes de todos estos productos
      await queryInterface.sequelize.query(
        'DELETE FROM "ProductoVariantes" WHERE "productoId" IN (SELECT id FROM "Productos" WHERE nombre IN (:nombres))',
        { replacements: { nombres }, transaction }
      );

      // Los productos nuevos se borran...
      await queryInterface.bulkDelete(
        'Productos',
        { nombre: { [Sequelize.Op.in]: nombres.filter((n) => !reutilizados.includes(n)) } },
        { transaction }
      );

      // ...y los reutilizados vuelven a como estaban
      for (const [nombreActual, original] of Object.entries(ORIGINALES)) {
        await queryInterface.bulkUpdate(
          'Productos',
          { ...original, updatedAt: new Date() },
          { nombre: nombreActual },
          { transaction }
        );
      }
    });
  },
};