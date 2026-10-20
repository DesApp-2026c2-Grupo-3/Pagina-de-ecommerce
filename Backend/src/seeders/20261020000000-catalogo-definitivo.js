'use strict';

// Semilla ÚNICA del catálogo: reemplaza a todas las anteriores (están en seeders/_historico, solo como referencia).
// Carga, en orden: categorías, tamaños, sucursales, admin, insumos, stock, productos, precios por tamaño,
// recetas y grupos de combo. Los datos están en ./datos/catalogo-definitivo.json, referenciados por NOMBRE.
//
// - Idempotente: si algo ya existe (por nombre), no lo duplica. Se puede correr más de una vez.
// - Para cambiar el catálogo: editar el JSON (o agregar una semilla nueva), nunca las semillas viejas.

const DATOS = require('./datos/catalogo-definitivo.json');

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      const q = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, transaction }))[0];
      // id de una fila por una o más columnas (null si no existe)
      const idDe = async (tabla, where, extra = '') => {
        const cols = Object.keys(where);
        const cond = cols.map((c) => `"${c}" = :${c}`).join(' AND ');
        const [fila] = await q(`SELECT id FROM "${tabla}" WHERE ${cond} ${extra} LIMIT 1`, where);
        return fila?.id ?? null;
      };
      // Inserta si no existe y devuelve el id
      const asegurar = async (tabla, where, valores, extra = '') => {
        const existente = await idDe(tabla, where, extra);
        if (existente) return existente;
        const fila = { ...valores, createdAt: new Date(), updatedAt: new Date() };
        const cols = Object.keys(fila);
        const [nueva] = await q(
          `INSERT INTO "${tabla}" (${cols.map((c) => `"${c}"`).join(', ')})
           VALUES (${cols.map((c) => (c === 'horario' ? `CAST(:${c} AS jsonb)` : `:${c}`)).join(', ')})
           RETURNING id`,
          fila
        );
        return nueva.id;
      };

      const ids = { categoria: {}, tamanio: {}, sucursal: {}, insumo: {}, producto: {} };
      const buscar = (tipo, nombre) => {
        const id = ids[tipo][nombre];
        if (!id) throw new Error(`Catálogo definitivo: no existe ${tipo} "${nombre}"`);
        return id;
      };

      for (const nombre of DATOS.categorias) {
        ids.categoria[nombre] = await asegurar('Categoria', { nombre }, { nombre });
      }

      for (const t of DATOS.tamanios) {
        ids.tamanio[t.nombre] = await asegurar('Tamanios', { nombre: t.nombre }, t);
      }

      for (const s of DATOS.sucursales) {
        ids.sucursal[s.nombre] = await asegurar('Sucursals', { nombre: s.nombre }, { ...s, horario: JSON.stringify(s.horario) });
      }

      for (const { sucursal, ...admin } of DATOS.admins) {
        await asegurar('Admins', { email: admin.email }, {
          ...admin,
          sucursalId: sucursal ? buscar('sucursal', sucursal) : null,
        });
      }

      for (const i of DATOS.insumos) {
        ids.insumo[i.nombre] = await asegurar('Insumos', { nombre: i.nombre }, i);
      }

      for (const s of DATOS.stock) {
        await asegurar(
          'StockSucursals',
          { insumoId: buscar('insumo', s.insumo), sucursalId: buscar('sucursal', s.sucursal) },
          {
            insumoId: buscar('insumo', s.insumo),
            sucursalId: buscar('sucursal', s.sucursal),
            cantidad: s.cantidad,
            stockMinimo: s.stockMinimo,
          }
        );
      }

      for (const { categoria, ...p } of DATOS.productos) {
        ids.producto[p.nombre] = await asegurar(
          'Productos',
          { nombre: p.nombre },
          { ...p, categoriaId: buscar('categoria', categoria) },
          'AND "deletedAt" IS NULL'
        );
      }

      for (const { producto, tamanio, ...pt } of DATOS.productoTamanios) {
        const where = { productoId: buscar('producto', producto), tamanioId: buscar('tamanio', tamanio) };
        await asegurar('ProductoTamanios', where, { ...where, ...pt });
      }

      for (const { producto, insumo, ...r } of DATOS.recetas) {
        const where = { productoId: buscar('producto', producto), insumoId: buscar('insumo', insumo) };
        await asegurar('RecetaInsumos', where, { ...where, ...r });
      }

      for (const { producto, categoria, incluido, ...g } of DATOS.comboGrupos) {
        const productoId = buscar('producto', producto);
        await asegurar('ComboGrupos', { productoId, nombre: g.nombre }, {
          ...g,
          productoId,
          categoriaId: buscar('categoria', categoria),
          productoIncluidoId: buscar('producto', incluido),
        });
      }
    });
  },

  // Saca el catálogo sin romper pedidos viejos: los productos van con borrado lógico.
  // Sucursales y admin quedan (los usan pedidos y usuarios). Para empezar de cero: db:drop + db:create.
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