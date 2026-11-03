'use strict';

// Carga el menú que hasta ahora estaba fijo en el front (Frontend/src/config/gruposCatalogo.ts + los estilos de
// categorias.ts): ./datos/menu-inicial.json, con las categorías y los productos referenciados por NOMBRE.
//
// Es re-ejecutable y no pisa lo que el master edite: si ya hay grupos, no hace nada.
// Un producto o una categoría que no existe en la base se saltea (y se avisa por consola).
// Se corre DESPUÉS de la migración 20261102120000-menu y de las semillas del catálogo y de cafetería/salsas.
const MENU = require('./datos/menu-inicial.json');

const normalizar = (nombre) => String(nombre).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      const q = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, transaction }))[0];

      const [{ total }] = await q('SELECT COUNT(*)::int AS total FROM "MenuGrupos"');
      if (total > 0) return;

      const categorias = new Map((await q('SELECT id, nombre FROM "Categoria"')).map((c) => [normalizar(c.nombre), c.id]));
      const productos = new Map(
        (await q('SELECT id, nombre FROM "Productos" WHERE "deletedAt" IS NULL')).map((p) => [normalizar(p.nombre), p.id])
      );
      const categoriaId = (nombre, donde) => {
        const id = categorias.get(normalizar(nombre));
        if (id === undefined) console.warn(`Menú (${donde}): no existe la categoría "${nombre}"`);
        return id;
      };

      for (const grupo of MENU) {
        const [{ id: grupoId }] = await q(
          `INSERT INTO "MenuGrupos" (slug, nombre, orden, "porSecciones", activo, "createdAt", "updatedAt")
           VALUES (:slug, :nombre, :orden, :porSecciones, true, NOW(), NOW()) RETURNING id`,
          { slug: grupo.slug, nombre: grupo.nombre, orden: grupo.orden, porSecciones: grupo.porSecciones }
        );

        const idsGrupo = [...new Set(grupo.categorias.map((c) => categoriaId(c, grupo.slug)).filter((id) => id !== undefined))];
        if (idsGrupo.length > 0) {
          await queryInterface.bulkInsert(
            'MenuGrupoCategorias',
            idsGrupo.map((id) => ({ grupoId, categoriaId: id, createdAt: new Date(), updatedAt: new Date() })),
            { transaction }
          );
        }

        for (const seccion of grupo.secciones) {
          // Una sección toma los productos de su categoría (si tiene una real en la base) y los puestos a mano
          const categorias_ = seccion.categorias.map((c) => categorias.get(normalizar(c))).filter((id) => id !== undefined);
          const [{ id: seccionId }] = await q(
            `INSERT INTO "MenuSecciones" ("grupoId", slug, nombre, orden, icono, fondo, "categoriaId", "esPorDefecto", activo, "createdAt", "updatedAt")
             VALUES (:grupoId, :slug, :nombre, :orden, :icono, :fondo, :categoriaId, :esPorDefecto, true, NOW(), NOW()) RETURNING id`,
            {
              grupoId,
              slug: seccion.slug,
              nombre: seccion.nombre,
              orden: seccion.orden,
              icono: seccion.icono,
              fondo: seccion.fondo,
              categoriaId: categorias_[0] ?? null,
              esPorDefecto: grupo.porDefecto === seccion.slug,
            }
          );

          const idsProductos = [];
          for (const nombre of seccion.productos) {
            const id = productos.get(normalizar(nombre));
            if (id === undefined) console.warn(`Menú (${grupo.slug}/${seccion.slug}): no existe el producto "${nombre}"`);
            else idsProductos.push(id);
          }
          if (idsProductos.length > 0) {
            await queryInterface.bulkInsert(
              'MenuSeccionProductos',
              idsProductos.map((productoId, indice) => ({
                seccionId, productoId, orden: (indice + 1) * 10, createdAt: new Date(), updatedAt: new Date(),
              })),
              { transaction }
            );
          }
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM "MenuGrupos"');
  },
};
