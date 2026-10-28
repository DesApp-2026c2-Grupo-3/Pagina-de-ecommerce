'use strict';

// Segunda pasada de limpieza para la presentación (después de 20261019130000-limpiar-catalogo-presentacion).
//  - Saca productos que no van (borrado lógico).
//  - Renombra algunas bebidas y cafés, y les asigna su imagen.
//  - Recupera "Aros de Cebolla x8" (Nuggets) con su imagen.
// Todo por NOMBRE. Se puede correr más de una vez.

const A_SACAR = [
  // Nuggets
  'Nuggets de Queso x6',
  // Bebidas
  'Agua con gas',
  'Jugo de Manzana',
  'Limonada Fresca',
  'Té Helado de Durazno',
  'Batido de Vainilla',
  // Cafés
  'Café con Leche',
  'Capuchino',
  'Latte Vainilla',
  'Chocolatada Caliente',
  'Frappé de Café',
  // Para comer
  'Medialunas x3',
];

// Productos que cambian: se buscan por cualquiera de los nombres de "antes".
const CAMBIOS = [
  {
    antes: ['Gaseosa Naranja'],
    nombre: 'Fanta',
    imagen: '/imagenes/Bebidas/fanta.png',
  },
  {
    antes: ['Lima-Limón', 'Lima-Limon'],
    nombre: 'Sprite',
    imagen: '/imagenes/Bebidas/sprite.png',
  },
  {
    antes: ['Expresso', 'Esspreso', 'Espreso', 'Espresso'],
    nombre: 'Espresso',
    imagen: '/imagenes/Cafe/Esspreso.png',
  },
  {
    antes: ['Cortado'],
    nombre: 'Latte',
    descripcion: 'Espresso con leche vaporizada y una capa suave de espuma. Cremoso y equilibrado.',
    imagen: '/imagenes/Cafe/Cortado.png',
  },
  {
    antes: ['Aros de Cebolla x8', 'Aros de Cebolla'],
    nombre: 'Aros de Cebolla x8',
    imagen: '/imagenes/Nuggets/Aros-Cebolla.png',
    restaurar: true, // si estaba borrado, vuelve
  },
];

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        'UPDATE "Productos" SET "deletedAt" = NOW(), "updatedAt" = NOW() WHERE nombre IN (:nombres) AND "deletedAt" IS NULL',
        { replacements: { nombres: A_SACAR }, transaction }
      );

      for (const c of CAMBIOS) {
        await sequelize.query(
          `UPDATE "Productos"
              SET nombre = :nombre,
                  imagen = :imagen,
                  descripcion = COALESCE(:descripcion, descripcion),
                  "deletedAt" = CASE WHEN :restaurar THEN NULL ELSE "deletedAt" END,
                  "updatedAt" = NOW()
            WHERE nombre IN (:antes)`,
          {
            replacements: {
              nombre: c.nombre,
              imagen: c.imagen,
              descripcion: c.descripcion ?? null,
              restaurar: Boolean(c.restaurar),
              antes: c.antes,
            },
            transaction,
          }
        );
      }

      // Aviso si no existe "Aros de Cebolla": hay que correr antes 20261017120000-categorias-faltantes
      const [aros] = await sequelize.query(
        'SELECT id FROM "Productos" WHERE nombre = :nombre AND "deletedAt" IS NULL',
        { replacements: { nombre: 'Aros de Cebolla x8' }, transaction }
      );
      if (aros.length === 0) {
        console.warn('⚠️  No se encontró "Aros de Cebolla x8": corré la semilla 20261017120000-categorias-faltantes.');
      }
    });
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        'UPDATE "Productos" SET "deletedAt" = NULL, "updatedAt" = NOW() WHERE nombre IN (:nombres)',
        { replacements: { nombres: A_SACAR }, transaction }
      );

      // Los nombres vuelven al primero de "antes" (la descripción del Latte queda como está)
      for (const c of CAMBIOS) {
        if (c.antes[0] === c.nombre) continue;
        await sequelize.query(
          'UPDATE "Productos" SET nombre = :anterior, "updatedAt" = NOW() WHERE nombre = :nombre',
          { replacements: { anterior: c.antes[0], nombre: c.nombre }, transaction }
        );
      }
    });
  },
};