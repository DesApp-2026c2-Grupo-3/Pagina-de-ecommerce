'use strict';

// Borrado lógico de categorías: "eliminar" completa deletedAt en vez de borrar la fila.
// Antes, al borrar una categoría, la base dejaba a sus productos sin categoría (SET NULL),
// incluso a los productos eliminados que siguen apareciendo en pedidos y reportes.
//
// Como en insumos: el nombre pasa a ser único solo entre las categorías NO eliminadas.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Categoria', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      }, { transaction });

      await queryInterface.sequelize.query(
        'ALTER TABLE "Categoria" DROP CONSTRAINT IF EXISTS "Categoria_nombre_key"',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX "categorias_nombre_no_eliminada" ON "Categoria" (nombre) WHERE "deletedAt" IS NULL',
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS "categorias_nombre_no_eliminada"', { transaction });
      await queryInterface.sequelize.query(
        'ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_nombre_key" UNIQUE (nombre)',
        { transaction }
      );
      await queryInterface.removeColumn('Categoria', 'deletedAt', { transaction });
    });
  },
};