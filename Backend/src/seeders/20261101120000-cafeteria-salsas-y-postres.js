'use strict';

// Deja el catálogo listo para las categorías con jerarquía. Es re-ejecutable y no pisa cambios del master.
//
//  1. "Cafetería": categoría principal que junta a Café y Menú Café (el Home muestra una sola tarjeta).
//     Ocupa el lugar que tenía Café en el orden.
//  2. "Salsas": categoría complemento (no cuenta en el ranking de más pedidos ni se sugiere en el carrito),
//     siempre al final. Vuelven las seis salsas; Mayonesa, Ketchup, Mostaza y Salsa Barbacoa pasan a ser gratis.
//  3. "Postres": sin tamaños (como los Nuggets): se piden de una sola medida.
//
// Se corre DESPUÉS de la migración 20261101120000-categorias-jerarquia y de las semillas del catálogo
// (restaurar-menu-y-salsas es la que crea o reactiva las seis salsas con sus insumos y recetas).

const SALSAS = ['Mayonesa', 'Ketchup', 'Mostaza', 'Salsa Barbacoa', 'Salsa Picante de la Casa', 'Cheddar Fundido'];

// Salsas gratis, con el precio que tenían: si el master ya les puso otro precio, no se toca
const SALSAS_GRATIS = { Mayonesa: 500, Ketchup: 500, Mostaza: 500, 'Salsa Barbacoa': 600 };

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      const q = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, transaction }))[0];
      const idDe = async (nombre) => (await q('SELECT id, orden FROM "Categoria" WHERE nombre = :nombre LIMIT 1', { nombre }))[0] ?? null;

      // 1. Cafetería
      const cafe = await idDe('Café');
      const menuCafe = await idDe('Menú Café');
      if (cafe && menuCafe) {
        let cafeteria = await idDe('Cafetería');
        if (!cafeteria) {
          [cafeteria] = await q(
            `INSERT INTO "Categoria" (nombre, activo, "categoriaPadreId", orden, "esComplemento", "createdAt", "updatedAt")
             VALUES ('Cafetería', true, NULL, :orden, false, NOW(), NOW())
             RETURNING id, orden`,
            { orden: cafe.orden }
          );
        }
        // Las hijas se ordenan entre ellas: primero Café, después Menú Café
        await q('UPDATE "Categoria" SET "categoriaPadreId" = :padre, orden = 10, "updatedAt" = NOW() WHERE id = :id', { padre: cafeteria.id, id: cafe.id });
        await q('UPDATE "Categoria" SET "categoriaPadreId" = :padre, orden = 20, "updatedAt" = NOW() WHERE id = :id', { padre: cafeteria.id, id: menuCafe.id });
      } else {
        console.warn('Cafetería: no están las categorías Café y Menú Café, no se arma la jerarquía.');
      }

      // 2. Salsas: complemento, siempre última
      const salsas = await idDe('Salsas');
      if (salsas) {
        await q(
          `UPDATE "Categoria"
              SET "esComplemento" = true, "categoriaPadreId" = NULL, activo = true, "updatedAt" = NOW(),
                  orden = (SELECT COALESCE(MAX(orden), 0) FROM "Categoria" WHERE id <> :id) + 10
            WHERE id = :id`,
          { id: salsas.id }
        );
        const existentes = await q(
          'SELECT nombre FROM "Productos" WHERE "categoriaId" = :id AND "deletedAt" IS NULL',
          { id: salsas.id }
        );
        const faltan = SALSAS.filter((nombre) => !existentes.some((p) => p.nombre === nombre));
        if (faltan.length > 0) {
          console.warn(`Salsas: faltan ${faltan.join(', ')}. Corré la semilla restaurar-menu-y-salsas (y la de imágenes) y volvé a correr esta.`);
        }
        for (const [nombre, precioAnterior] of Object.entries(SALSAS_GRATIS)) {
          await q(
            `UPDATE "Productos" SET precio = 0, "updatedAt" = NOW()
              WHERE nombre = :nombre AND "categoriaId" = :categoriaId AND "deletedAt" IS NULL AND precio = :precioAnterior`,
            { nombre, categoriaId: salsas.id, precioAnterior }
          );
        }
      } else {
        console.warn('Salsas: no existe la categoría; corré la semilla restaurar-menu-y-salsas y volvé a correr esta.');
      }

      // 3. Postres: sin selector de tamaño
      const postres = await idDe('Postres');
      if (postres) {
        await q(
          `DELETE FROM "ProductoTamanios"
            WHERE "productoId" IN (SELECT id FROM "Productos" WHERE "categoriaId" = :categoriaId)`,
          { categoriaId: postres.id }
        );
      }
    });
  },

  // Deshace la jerarquía y la marca de complemento. No devuelve los tamaños de Postres ni los precios de las salsas.
  async down(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      const q = (sql) => sequelize.query(sql, { transaction });
      await q(`UPDATE "Categoria" SET "categoriaPadreId" = NULL WHERE "categoriaPadreId" IN (SELECT id FROM "Categoria" WHERE nombre = 'Cafetería')`);
      await q(`DELETE FROM "Categoria" c WHERE c.nombre = 'Cafetería' AND NOT EXISTS (SELECT 1 FROM "Productos" p WHERE p."categoriaId" = c.id)`);
      await q(`UPDATE "Categoria" SET "esComplemento" = false WHERE nombre = 'Salsas'`);
    });
  },
};
