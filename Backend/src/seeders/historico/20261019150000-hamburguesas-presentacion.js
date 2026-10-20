'use strict';

// Hamburguesas y combos para la presentación.
//  1. Saca hamburguesas (y su combo) con borrado lógico.
//  2. Renombra hamburguesas (y su combo).
//  3. Corrige recetas para que coincidan con la imagen (en la hamburguesa y en su combo).
//  4. Saca todo "Combo X" cuya hamburguesa X ya no está en el catálogo.
//  5. Papas y bebida del combo pasan a ser opcionales (se puede pedir "sin", al mismo precio).
// Todo por NOMBRE. Se puede correr más de una vez.

const combo = (nombre) => `Combo ${nombre}`;

const A_SACAR = [
  'Pumper-Nic (RETRO)',
  'La Divina ConMedia (Res)',
  'Ambrosía del Olimpo',
  'Verde que te Quiero Verde',
  'Criolla Parrillera',
  'Fast & Furious',
];

const RENOMBRES = [
  ['Palta Power', 'Fast Green'],
  ['Modo Bestia', 'Bestia Fast'],
  ['Picante Express', 'Spicy Fast'],
  ['Crack Crispy', 'Crispy Crack'],
  ['Fast Ranch', 'Crispy Ranch'],
];

// fijar: [insumo, cantidadBase, removible]. Se agrega si falta; si está, se actualiza.
// Agregable = removible y el insumo tiene precio de extra (misma regla que el resto del catálogo).
const RECETAS = [
  { hamburguesa: 'Habemus Bacon', fijar: [['Queso (feta)', 1, true]] },
  { hamburguesa: 'Doble Fast Cheese', fijar: [['Queso (feta)', 2, true]] },
  { hamburguesa: 'Doble Habemus', fijar: [['Queso (feta)', 2, true]] },
  {
    hamburguesa: 'Abominación',
    quitar: ['Cebolla'],
    fijar: [['Aros de cebolla fritos', 3, true], ['Queso (feta)', 1, true], ['Cebolla morada', 2, true], ['Lechuga', 2, true]],
  },
  {
    hamburguesa: 'Pickle Me Fast',
    fijar: [['Queso (feta)', 1, true], ['Lechuga', 2, true], ['Tomate', 2, true]],
  },
];

// Lugares del combo que pasan a ser opcionales
const GRUPOS_OPCIONALES = ['Acompañamiento', 'Una bebida'];

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      const q = (sql, replacements) => sequelize.query(sql, { replacements, transaction });

      // 1. Hamburguesas y sus combos: borrado lógico
      await q(
        'UPDATE "Productos" SET "deletedAt" = NOW(), "updatedAt" = NOW() WHERE nombre IN (:nombres) AND "deletedAt" IS NULL',
        { nombres: [...A_SACAR, ...A_SACAR.map(combo)] }
      );

      // 2. Renombres (hamburguesa y combo)
      for (const [antes, despues] of RENOMBRES) {
        for (const [a, d] of [[antes, despues], [combo(antes), combo(despues)]]) {
          await q('UPDATE "Productos" SET nombre = :d, "updatedAt" = NOW() WHERE nombre = :a', { a, d });
        }
      }

      // 3. Recetas: en la hamburguesa y en su combo (el combo copia la receta de su hamburguesa)
      for (const r of RECETAS) {
        const [productos] = await q(
          'SELECT id FROM "Productos" WHERE nombre IN (:nombres) AND "deletedAt" IS NULL',
          { nombres: [r.hamburguesa, combo(r.hamburguesa)] }
        );
        for (const { id: productoId } of productos) {
          if (r.quitar?.length) {
            await q(
              `DELETE FROM "RecetaInsumos" WHERE "productoId" = :productoId
                 AND "insumoId" IN (SELECT id FROM "Insumos" WHERE nombre IN (:quitar))`,
              { productoId, quitar: r.quitar }
            );
          }
          for (const [insumo, cantidad, removible] of r.fijar) {
            const [[ins]] = await q('SELECT id, "precioComercial" FROM "Insumos" WHERE nombre = :insumo', { insumo });
            if (!ins) throw new Error(`Falta el insumo "${insumo}": corré antes las semillas de catálogo`);
            const agregable = removible && ins.precioComercial !== null;

            const [[existente]] = await q(
              'SELECT id FROM "RecetaInsumos" WHERE "productoId" = :productoId AND "insumoId" = :insumoId',
              { productoId, insumoId: ins.id }
            );
            if (existente) {
              await q(
                `UPDATE "RecetaInsumos" SET "cantidadBase" = :cantidad, "esRemovible" = :removible,
                        "esAgregable" = :agregable, "updatedAt" = NOW() WHERE id = :id`,
                { cantidad, removible, agregable, id: existente.id }
              );
            } else {
              await q(
                `INSERT INTO "RecetaInsumos" ("productoId", "insumoId", "cantidadBase", "esRemovible", "esAgregable", "createdAt", "updatedAt")
                 VALUES (:productoId, :insumoId, :cantidad, :removible, :agregable, NOW(), NOW())`,
                { productoId, insumoId: ins.id, cantidad, removible, agregable }
              );
            }
          }
        }
      }

      // 4. "Combo X" sin su hamburguesa X en el catálogo → afuera
      await q(
        `UPDATE "Productos" c SET "deletedAt" = NOW(), "updatedAt" = NOW()
          WHERE c."deletedAt" IS NULL
            AND c.nombre LIKE 'Combo %'
            AND c."categoriaId" IN (SELECT id FROM "Categoria" WHERE nombre = 'Combos')
            AND NOT EXISTS (
              SELECT 1 FROM "Productos" h
               WHERE h."deletedAt" IS NULL AND h.nombre = substring(c.nombre FROM 7)
            )`
      );

      // 5. Papas y bebida del combo: opcionales
      await q('UPDATE "ComboGrupos" SET obligatorio = false, "updatedAt" = NOW() WHERE nombre IN (:grupos)', {
        grupos: GRUPOS_OPCIONALES,
      });
    });
  },

  // Deshace los borrados, los renombres y los grupos opcionales.
  // Las recetas NO se revierten (volver a correr las semillas de catálogo si hiciera falta).
  async down(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      const q = (sql, replacements) => sequelize.query(sql, { replacements, transaction });

      await q('UPDATE "ComboGrupos" SET obligatorio = true, "updatedAt" = NOW() WHERE nombre IN (:grupos)', {
        grupos: GRUPOS_OPCIONALES,
      });

      for (const [antes, despues] of RENOMBRES) {
        for (const [a, d] of [[antes, despues], [combo(antes), combo(despues)]]) {
          await q('UPDATE "Productos" SET nombre = :a, "updatedAt" = NOW() WHERE nombre = :d', { a, d });
        }
      }

      await q('UPDATE "Productos" SET "deletedAt" = NULL, "updatedAt" = NOW() WHERE nombre IN (:nombres)', {
        nombres: [...A_SACAR, ...A_SACAR.map(combo)],
      });
    });
  },
};