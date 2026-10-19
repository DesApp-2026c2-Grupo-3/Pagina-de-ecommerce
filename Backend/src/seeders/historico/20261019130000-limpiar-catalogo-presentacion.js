'use strict';

// Limpieza del catálogo para la presentación: se sacan las categorías sin imágenes.
//  - Productos: borrado lógico (deletedAt). Los pedidos viejos los siguen mostrando.
//  - Categorías: se borran (no tienen borrado lógico). Antes, sus productos quedan con
//    categoriaId = NULL por la FK (ON DELETE SET NULL); el down los vuelve a asignar por nombre.
//  - Insumo "Juguete sorpresa": se borra (solo lo usaban las cajitas). Por las FK en CASCADE
//    se van también su stock, sus filas de receta y sus movimientos.
// Todo se busca por NOMBRE (los ids cambian entre bases). Se puede correr más de una vez.

const A_SACAR = {
  'Cajita Mágica': [
    'Cajita Nuggets y Fritas',
    'Cajita Nuggets y Ensalada',
    'Cajita Hamburguesa de Queso y Fritas',
    'Cajita Hamburguesa de Queso y Ensalada',
  ],
  Salsas: ['Ketchup', 'Mostaza', 'Mayonesa', 'Salsa Barbacoa', 'Cheddar Fundido', 'Salsa Picante de la Casa'],
  Ensaladas: ['Ensalada Caprese', 'Ensalada César', 'Ensalada Mixta', 'Ensalada de Pollo y Palta'],
  Postres: [
    'Brownie con Helado',
    'Cheesecake de Frutos Rojos',
    'Donas Glaseadas x3',
    'Helado Crunch',
    'Helado Sundae',
    'Tarta de Manzana Frita',
  ],
  'Sin TACC': ['Brownie Sin TACC', 'Hamburguesa Sin TACC', 'Nuggets Sin TACC x6', 'Papas Sin TACC'],
  'Combos de Cafetería': [
    'Combo Desayuno',
    'Combo Merienda',
    'Café y Medialunas',
    'Tostado Express',
    'Dulce Mañana',
    'Americano Completo',
    'Merienda Dulce',
  ],
};

const INSUMOS_A_SACAR = ['Juguete sorpresa'];

const categorias = Object.keys(A_SACAR);
const productos = Object.values(A_SACAR).flat();

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      // 1. Productos: borrado lógico (solo los que todavía no estaban borrados)
      await sequelize.query(
        'UPDATE "Productos" SET "deletedAt" = NOW(), "updatedAt" = NOW() WHERE nombre IN (:productos) AND "deletedAt" IS NULL',
        { replacements: { productos }, transaction }
      );

      // 2. Categorías: solo si ya no les queda ningún producto activo
      await sequelize.query(
        `DELETE FROM "Categoria" c
          WHERE c.nombre IN (:categorias)
            AND NOT EXISTS (SELECT 1 FROM "Productos" p WHERE p."categoriaId" = c.id AND p."deletedAt" IS NULL)`,
        { replacements: { categorias }, transaction }
      );

      // 3. Insumos que ya no usa ningún producto del catálogo
      await sequelize.query('DELETE FROM "Insumos" WHERE nombre IN (:insumos)', {
        replacements: { insumos: INSUMOS_A_SACAR },
        transaction,
      });
    });
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      for (const [categoria, nombres] of Object.entries(A_SACAR)) {
        // Vuelve la categoría (si no existe) y se le reasignan sus productos
        await sequelize.query(
          `INSERT INTO "Categoria" (nombre, "createdAt", "updatedAt")
           SELECT :categoria, NOW(), NOW()
           WHERE NOT EXISTS (SELECT 1 FROM "Categoria" WHERE nombre = :categoria)`,
          { replacements: { categoria }, transaction }
        );
        await sequelize.query(
          `UPDATE "Productos"
              SET "deletedAt" = NULL, "updatedAt" = NOW(),
                  "categoriaId" = (SELECT id FROM "Categoria" WHERE nombre = :categoria)
            WHERE nombre IN (:nombres)`,
          { replacements: { categoria, nombres }, transaction }
        );
      }

      // El insumo vuelve, pero sin stock ni recetas (se borraron en cascada):
      // para recuperarlos, volver a correr la semilla 20261017120000-categorias-faltantes.
      for (const nombre of INSUMOS_A_SACAR) {
        await sequelize.query(
          `INSERT INTO "Insumos" (nombre, "unidadMedida", "createdAt", "updatedAt")
           SELECT :nombre, 'unidad', NOW(), NOW()
           WHERE NOT EXISTS (SELECT 1 FROM "Insumos" WHERE nombre = :nombre)`,
          { replacements: { nombre }, transaction }
        );
      }
    });
  },
};