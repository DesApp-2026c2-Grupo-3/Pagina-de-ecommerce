'use strict';

// Restaura lo que había quedado afuera del catálogo definitivo y deja las imágenes al día.
// Se corre DESPUÉS de 20261020000000-catalogo-definitivo.js y de la migración 20261021120000-tamanios-imagen.
//
// Qué hace (los datos están en ./datos/restaurar-menu.json, referenciados por NOMBRE):
//  - Categorías nuevas: Postres, Ensaladas y Salsas.
//  - Insumos nuevos (con stock en todas las sucursales que existan).
//  - Productos que se habían sacado: la hamburguesa veggie "Seed Vicious" (+ su combo), los cafés
//    (Café con Leche, Capuchino, Latte Vainilla, Submarino, Frappé), los postres, las 4 ensaladas
//    y las 6 salsas (que solo se ofrecen en el carrito). Cada uno con su receta y tamaños.
//    Las imágenes usan las MISMAS rutas que tenían antes (si el archivo no está, queda sin foto
//    hasta que lo copies a Frontend/public/imagenes/...).
//  - Si un producto estaba con borrado lógico (o con su nombre anterior, ej. "Chocolatada Caliente"),
//    se reactiva / renombra en lugar de crear uno duplicado.
//  - Sincroniza la imagen de los productos del catálogo definitivo (corrige rutas viejas, ej. Habemus Bacon)
//    y carga la imagen de los tamaños (/imagenes/Formatos/Formato-*.png) solo donde todavía no tienen.
//
// Es re-ejecutable: no duplica nada y no pisa productos activos que ya existan.

const CATALOGO = require('./datos/catalogo-definitivo.json');
const DATOS = require('./datos/restaurar-menu.json');

const TABLAS = { categoria: 'Categoria', tamanio: 'Tamanios', insumo: 'Insumos', producto: 'Productos' };

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      const q = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, transaction }))[0];
      const idDe = async (tabla, where, extra = '') => {
        const cols = Object.keys(where);
        const cond = cols.map((c) => `"${c}" = :${c}`).join(' AND ');
        const [fila] = await q(`SELECT id FROM "${tabla}" WHERE ${cond} ${extra} LIMIT 1`, where);
        return fila?.id ?? null;
      };
      const asegurar = async (tabla, where, valores, extra = '') => {
        const existente = await idDe(tabla, where, extra);
        if (existente) return existente;
        const fila = { ...valores, createdAt: new Date(), updatedAt: new Date() };
        const cols = Object.keys(fila);
        const [nueva] = await q(
          `INSERT INTO "${tabla}" (${cols.map((c) => `"${c}"`).join(', ')})
           VALUES (${cols.map((c) => `:${c}`).join(', ')})
           RETURNING id`,
          fila
        );
        return nueva.id;
      };

      // Ids por nombre: primero lo que se creó acá, si no, lo que ya estaba en la base
      const ids = { categoria: {}, tamanio: {}, insumo: {}, producto: {} };
      const buscar = async (tipo, nombre) => {
        if (ids[tipo][nombre]) return ids[tipo][nombre];
        const extra = tipo === 'producto' ? 'AND "deletedAt" IS NULL' : '';
        const id = await idDe(TABLAS[tipo], { nombre }, extra);
        if (!id) throw new Error(`Restaurar menú: no existe ${tipo} "${nombre}" (¿corriste antes el catálogo definitivo?)`);
        ids[tipo][nombre] = id;
        return id;
      };

      // 1. Categorías
      for (const nombre of DATOS.categorias) {
        ids.categoria[nombre] = await asegurar('Categoria', { nombre }, { nombre });
      }

      // 2. Insumos nuevos + su stock en todas las sucursales
      const sucursales = await q('SELECT id FROM "Sucursals"');
      for (const { stockCantidad, stockMinimo, ...insumo } of DATOS.insumos) {
        const insumoId = await asegurar('Insumos', { nombre: insumo.nombre }, insumo);
        ids.insumo[insumo.nombre] = insumoId;
        for (const { id: sucursalId } of sucursales) {
          await asegurar(
            'StockSucursals',
            { insumoId, sucursalId },
            { insumoId, sucursalId, cantidad: stockCantidad, stockMinimo }
          );
        }
      }

      // 3. Productos: se crean, o se reactivan / renombran si ya existían con otro nombre o borrados
      let creados = 0;
      let reactivados = 0;
      for (const { categoria, antes = [], ...p } of DATOS.productos) {
        const categoriaId = await buscar('categoria', categoria);
        const [existente] = await q(
          `SELECT id, nombre, "deletedAt" FROM "Productos"
            WHERE nombre IN (:nombres)
            ORDER BY ("deletedAt" IS NULL) DESC, id
            LIMIT 1`,
          { nombres: [p.nombre, ...antes] }
        );

        if (existente && !existente.deletedAt && existente.nombre === p.nombre) {
          ids.producto[p.nombre] = existente.id; // ya está activo: no se toca
        } else if (existente) {
          await q(
            `UPDATE "Productos"
                SET nombre = :nombre, descripcion = :descripcion, precio = :precio, imagen = :imagen,
                    sabor = :sabor, disponible = :disponible, "categoriaId" = :categoriaId,
                    "deletedAt" = NULL, "updatedAt" = NOW()
              WHERE id = :id`,
            { ...p, categoriaId, id: existente.id }
          );
          ids.producto[p.nombre] = existente.id;
          reactivados += 1;
        } else {
          ids.producto[p.nombre] = await asegurar('Productos', { nombre: p.nombre }, { ...p, categoriaId });
          creados += 1;
        }
      }

      // 4. Tamaños con precio, recetas y grupos de combo
      for (const { producto, tamanio, ...pt } of DATOS.productoTamanios) {
        const where = { productoId: await buscar('producto', producto), tamanioId: await buscar('tamanio', tamanio) };
        await asegurar('ProductoTamanios', where, { ...where, ...pt });
      }

      for (const { producto, insumo, ...r } of DATOS.recetas) {
        const where = { productoId: await buscar('producto', producto), insumoId: await buscar('insumo', insumo) };
        await asegurar('RecetaInsumos', where, { ...where, ...r });
      }

      for (const { producto, categoria, incluido, ...g } of DATOS.comboGrupos) {
        const productoId = await buscar('producto', producto);
        await asegurar('ComboGrupos', { productoId, nombre: g.nombre }, {
          ...g,
          productoId,
          categoriaId: await buscar('categoria', categoria),
          productoIncluidoId: await buscar('producto', incluido),
        });
      }

      // 5. Imágenes al día: las rutas del catálogo definitivo mandan (corrige rutas viejas en la base)
      for (const { nombre, imagen } of CATALOGO.productos) {
        await q(
          `UPDATE "Productos" SET imagen = :imagen, "updatedAt" = NOW()
            WHERE nombre = :nombre AND "deletedAt" IS NULL AND imagen IS DISTINCT FROM :imagen`,
          { nombre, imagen }
        );
      }

      // 6. Imagen de cada tamaño (regular / mediano / grande), solo si todavía no tiene
      for (const { nombre, imagen } of CATALOGO.tamanios) {
        if (!imagen) continue;
        await q('UPDATE "Tamanios" SET imagen = :imagen, "updatedAt" = NOW() WHERE nombre = :nombre AND imagen IS NULL', {
          nombre,
          imagen,
        });
      }

      console.log(`Restaurar menú: ${creados} productos creados, ${reactivados} reactivados o renombrados.`);
    });
  },

  // Saca lo restaurado sin romper pedidos viejos: los productos van con borrado lógico.
  // Las imágenes sincronizadas y las de los tamaños quedan como están.
  async down(queryInterface) {
    const { sequelize } = queryInterface;
    const productos = DATOS.productos.map((p) => p.nombre);
    const insumos = DATOS.insumos.map((i) => i.nombre);

    await sequelize.transaction(async (transaction) => {
      const q = (sql, replacements) => sequelize.query(sql, { replacements, transaction });
      const deProductos = 'SELECT id FROM "Productos" WHERE nombre IN (:productos)';

      await q(`DELETE FROM "ComboGrupos" WHERE "productoId" IN (${deProductos})`, { productos });
      await q(`DELETE FROM "ProductoTamanios" WHERE "productoId" IN (${deProductos})`, { productos });
      await q(`DELETE FROM "RecetaInsumos" WHERE "productoId" IN (${deProductos})`, { productos });
      await q('UPDATE "Productos" SET "deletedAt" = NOW() WHERE nombre IN (:productos) AND "deletedAt" IS NULL', { productos });
      await q('DELETE FROM "Insumos" WHERE nombre IN (:insumos)', { insumos });
      await q(
        `DELETE FROM "Categoria" c WHERE c.nombre IN (:categorias)
           AND NOT EXISTS (SELECT 1 FROM "Productos" p WHERE p."categoriaId" = c.id AND p."deletedAt" IS NULL)`,
        { categorias: DATOS.categorias }
      );
    });
  },
};
