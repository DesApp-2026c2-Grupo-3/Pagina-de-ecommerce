'use strict';

// Tabla de grupos de un combo: qué "lugares" elegibles tiene (Acompañamiento, Bebida, ...),
// de qué categoría se elige cada uno y cuál es la opción incluida en el precio.
// Reemplaza a la columna puente RecetaInsumos.grupoCombo: la receta del combo queda solo con
// sus partes fijas (hamburguesa, nuggets, etc.).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (texto) => queryInterface.sequelize.query(texto, { transaction });

      await queryInterface.createTable('ComboGrupos', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        // El combo (un registro de Productos de la categoría Combos)
        productoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Productos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        nombre: { type: Sequelize.STRING, allowNull: false },
        // Se elige un producto de esta categoría (ej: Papas Fritas, Bebidas)
        categoriaId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Categoria', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        // Opción que ya está incluida en el precio del combo: lo demás se cobra de más
        productoIncluidoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Productos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        obligatorio: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        icono: { type: Sequelize.STRING, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addConstraint('ComboGrupos', {
        fields: ['productoId', 'nombre'],
        type: 'unique',
        name: 'combo_grupo_unico',
        transaction,
      });

      // Pasar lo que ya estaba marcado con RecetaInsumos.grupoCombo a la tabla nueva.
      // La opción incluida es el primer producto (por id) de la categoría, como antes.
      await sql(`
        INSERT INTO "ComboGrupos"
          ("productoId", nombre, "categoriaId", "productoIncluidoId", obligatorio, orden, icono, "createdAt", "updatedAt")
        SELECT DISTINCT
          r."productoId",
          CASE r."grupoCombo" WHEN 'bebida' THEN 'Una bebida' ELSE 'Acompañamiento' END,
          c.id,
          (SELECT MIN(p.id) FROM "Productos" p WHERE p."categoriaId" = c.id),
          true,
          CASE r."grupoCombo" WHEN 'bebida' THEN 2 ELSE 1 END,
          CASE r."grupoCombo" WHEN 'bebida' THEN '🥤' ELSE '🍟' END,
          NOW(), NOW()
        FROM "RecetaInsumos" r
        JOIN "Categoria" c
          ON c.nombre = CASE r."grupoCombo" WHEN 'bebida' THEN 'Bebidas' ELSE 'Papas Fritas' END
        WHERE r."grupoCombo" IS NOT NULL
          AND (SELECT MIN(p.id) FROM "Productos" p WHERE p."categoriaId" = c.id) IS NOT NULL
      `);

      // Esos insumos ya no son parte fija de la receta: los aporta el producto que se elija
      await sql(`DELETE FROM "RecetaInsumos" WHERE "grupoCombo" IS NOT NULL`);
      await queryInterface.removeColumn('RecetaInsumos', 'grupoCombo', { transaction });

      // El tamaño del combo ya no agranda su receta (solo agranda lo elegido): factor neutro
      await sql(`UPDATE "ProductoTamanios" SET "factorStock" = 1 WHERE "productoId" IN (SELECT DISTINCT "productoId" FROM "ComboGrupos")`);
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (texto) => queryInterface.sequelize.query(texto, { transaction });

      await queryInterface.addColumn('RecetaInsumos', 'grupoCombo', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      // Vuelve a poner en la receta del combo los insumos de la opción incluida de cada grupo
      await sql(`
        INSERT INTO "RecetaInsumos"
          ("productoId", "insumoId", "cantidadBase", "esRemovible", "esAgregable", "grupoCombo", "createdAt", "updatedAt")
        SELECT g."productoId", r."insumoId", r."cantidadBase", false, false,
               CASE WHEN c.nombre = 'Bebidas' THEN 'bebida' ELSE 'acompanamiento' END,
               NOW(), NOW()
        FROM "ComboGrupos" g
        JOIN "Categoria" c ON c.id = g."categoriaId"
        JOIN "RecetaInsumos" r ON r."productoId" = g."productoIncluidoId"
      `);

      await queryInterface.dropTable('ComboGrupos', { transaction });
    });
  },
};
