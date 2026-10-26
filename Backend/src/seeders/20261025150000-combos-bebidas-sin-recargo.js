'use strict';

// En todos los combos, el lugar de Bebidas no cobra diferencia: cualquier bebida cuesta lo mismo.
// Se corre después de las semillas del catálogo (y sirve igual en una base que ya las tenía).
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE "ComboGrupos" SET "cobraDiferencia" = false, "updatedAt" = NOW()
      WHERE "categoriaId" IN (SELECT id FROM "Categoria" WHERE nombre = 'Bebidas')`);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE "ComboGrupos" SET "cobraDiferencia" = true, "updatedAt" = NOW()
      WHERE "categoriaId" IN (SELECT id FROM "Categoria" WHERE nombre = 'Bebidas')`);
  },
};