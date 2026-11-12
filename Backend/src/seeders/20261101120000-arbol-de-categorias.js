'use strict';

// Arma el árbol de categorías del menú. Las categorías principales son los botones del catálogo y sus
// hijas, el submenú. Cada producto queda en UNA categoría final (una que no tiene hijas).
// "Todos" no se guarda: el front lo agrega siempre al final.
//
//   Combos          → Combos Carne · Combos Pollo · Combos Vegetariano
//   Hamburguesas    → Hamburguesas Carne · Hamburguesas Pollo · Hamburguesas Vegetariano
//   Para acompañar  → Papas Fritas · Nuggets · Ensaladas
//   Bebidas         (sin submenú)
//   Cafetería       → Café · Desayunos y meriendas (antes "Menú Café")
//   Postres         (sin submenú, y sin tamaños)
//
// Los nombres de categoría son únicos, por eso las hijas llevan el nombre del padre adelante.
// La tienda lo saca al mostrar el submenú: se ve "Carne · Pollo · Vegetariano".
//
// También saca las salsas: sus productos quedan con borrado lógico (los pedidos viejos los siguen
// mostrando) y la categoría, deshabilitada.
//
// Se corre DESPUÉS de las semillas del catálogo (catalogo-definitivo y restaurar-menu-y-salsas).

// El orden de la lista es el orden de los botones. `icono` es el de la tarjeta del inicio.
const ARBOL = [
  { nombre: 'Combos', icono: 'combo', hijas: ['Combos Carne', 'Combos Pollo', 'Combos Vegetariano'] },
  { nombre: 'Hamburguesas', icono: 'hamburguesa', hijas: ['Hamburguesas Carne', 'Hamburguesas Pollo', 'Hamburguesas Vegetariano'] },
  { nombre: 'Para acompañar', icono: 'papas', hijas: ['Papas Fritas', 'Nuggets', 'Ensaladas'] },
  { nombre: 'Bebidas', icono: 'bebida', hijas: [] },
  { nombre: 'Cafetería', icono: 'cafe', hijas: ['Café', 'Desayunos y meriendas'] },
  { nombre: 'Postres', icono: 'postre', hijas: [] },
];

// Categorías que solo cambian de nombre (sus productos no se mueven)
const RENOMBRAR = { 'Menú Café': 'Desayunos y meriendas' };

// Productos que no van a la primera hija. El resto de los productos de Combos y de Hamburguesas
// va a la primera hija (la de carne).
const PRODUCTOS_A_MOVER = {
  'Combos Pollo': ['Combo Crispy Crack', 'Combo Crispy Ranch'],
  'Combos Vegetariano': ['Combo Seed Vicious'],
  'Hamburguesas Pollo': ['Crispy Crack', 'Crispy Ranch'],
  'Hamburguesas Vegetariano': ['Seed Vicious'],
};

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      const q = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, transaction }))[0];
      const idDe = async (nombre) => (await q('SELECT id FROM "Categoria" WHERE nombre = :nombre LIMIT 1', { nombre }))[0]?.id ?? null;

      // Devuelve el id de la categoría; si no existe, la crea
      const asegurar = async (nombre) => {
        const id = await idDe(nombre);
        if (id) return id;
        const [nueva] = await q(
          `INSERT INTO "Categoria" (nombre, activo, orden, "createdAt", "updatedAt")
           VALUES (:nombre, true, 0, NOW(), NOW()) RETURNING id`,
          { nombre }
        );
        return nueva.id;
      };

      // 1. Renombrar
      for (const [anterior, nuevo] of Object.entries(RENOMBRAR)) {
        if (!(await idDe(nuevo))) {
          await q('UPDATE "Categoria" SET nombre = :nuevo, "updatedAt" = NOW() WHERE nombre = :anterior', { anterior, nuevo });
        }
      }

      // 2. Armar el árbol: principales y sus hijas, con su orden
      for (const [i, { nombre, icono, hijas }] of ARBOL.entries()) {
        const padreId = await asegurar(nombre);
        await q(
          `UPDATE "Categoria" SET "categoriaPadreId" = NULL, orden = :orden, icono = :icono, activo = true, "updatedAt" = NOW()
           WHERE id = :id`,
          { id: padreId, orden: (i + 1) * 10, icono }
        );

        for (const [j, hija] of hijas.entries()) {
          const hijaId = await asegurar(hija);
          await q(
            `UPDATE "Categoria" SET "categoriaPadreId" = :padreId, orden = :orden, activo = true, "updatedAt" = NOW()
             WHERE id = :id`,
            { id: hijaId, padreId, orden: (j + 1) * 10 }
          );
        }
      }

      // 3. Mover productos puntuales a su hija
      for (const [categoria, productos] of Object.entries(PRODUCTOS_A_MOVER)) {
        await q(
          'UPDATE "Productos" SET "categoriaId" = :categoriaId, "updatedAt" = NOW() WHERE nombre IN (:productos)',
          { categoriaId: await idDe(categoria), productos }
        );
      }

      // 4. Una categoría con hijas no tiene productos propios: los que quedaron van a la primera hija
      for (const { nombre, hijas } of ARBOL) {
        if (hijas.length === 0) continue;
        await q(
          'UPDATE "Productos" SET "categoriaId" = :primera, "updatedAt" = NOW() WHERE "categoriaId" = :padre',
          { primera: await idDe(hijas[0]), padre: await idDe(nombre) }
        );
      }

      // 5. Salsas afuera
      const salsas = await idDe('Salsas');
      if (salsas) {
        await q('UPDATE "Productos" SET "deletedAt" = NOW() WHERE "categoriaId" = :id AND "deletedAt" IS NULL', { id: salsas });
        await q('UPDATE "Categoria" SET activo = false, "categoriaPadreId" = NULL, "updatedAt" = NOW() WHERE id = :id', { id: salsas });
      }

      // 6. Postres: se piden de una sola medida (sin selector de tamaño)
      const postres = await idDe('Postres');
      if (postres) {
        await q(
          'DELETE FROM "ProductoTamanios" WHERE "productoId" IN (SELECT id FROM "Productos" WHERE "categoriaId" = :id)',
          { id: postres }
        );
      }
    });
  },

  // No se deshace: para volver atrás, recreá la base y corré las semillas de nuevo
  async down() {},
};
