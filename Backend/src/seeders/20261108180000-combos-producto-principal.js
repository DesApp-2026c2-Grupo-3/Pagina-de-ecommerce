'use strict';

// Cada combo apunta a su producto principal y deja de tener receta propia (usa la del principal).
// Se corre DESPUÉS de catalogo-definitivo y restaurar-menu-y-salsas.
// Los combos nuevos se arman desde el admin, eligiendo el "Producto principal".

const PRINCIPAL_DE = {
  'Combo Fast Cheese': 'Fast Cheese',
  'Combo Habemus Bacon': 'Habemus Bacon',
  'Combo Pickle Me Fast': 'Pickle Me Fast',
  'Combo Fast Classic': 'Fast Classic',
  'Combo Fast & Onion': 'Fast & Onion',
  'Combo Doble Fast Cheese': 'Doble Fast Cheese',
  'Combo Abominación': 'Abominación',
  'Combo Bestia Fast': 'Bestia Fast',
  'Combo Crispy Crack': 'Crispy Crack',
  'Combo Fast Egg': 'Fast Egg',
  'Combo Doble Habemus': 'Doble Habemus',
  'Combo Fast Mushroom': 'Fast Mushroom',
  'Combo Spicy Fast': 'Spicy Fast',
  'Combo Crispy Ranch': 'Crispy Ranch',
  'Combo Fast Green': 'Fast Green',
  'Combo Magnum Fast': 'Magnum Fast',
  'Combo Blue Fast': 'Blue Fast',
  'Combo Seed Vicious': 'Seed Vicious',
};

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      const q = async (sql, replacements) => (await sequelize.query(sql, { replacements, transaction }))[0];

      for (const [combo, principal] of Object.entries(PRINCIPAL_DE)) {
        const [fila] = await q(
          `UPDATE "Productos" c
              SET "productoPrincipalId" = p.id, "updatedAt" = NOW()
             FROM "Productos" p
            WHERE c.nombre = :combo AND c."deletedAt" IS NULL
              AND p.nombre = :principal AND p."deletedAt" IS NULL
        RETURNING c.id`,
          { combo, principal }
        );
        if (!fila) throw new Error(`Combos: no se encontró "${combo}" o "${principal}"`);

        // La receta copiada sobra: el combo usa la del principal
        await q('DELETE FROM "RecetaInsumos" WHERE "productoId" = :id', { id: fila.id });
      }
    });
  },

  // Solo desarma el vínculo. Las recetas copiadas no vuelven: para eso, recrear la base.
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'UPDATE "Productos" SET "productoPrincipalId" = NULL WHERE nombre IN (:combos)',
      { replacements: { combos: Object.keys(PRINCIPAL_DE) } }
    );
  },
};