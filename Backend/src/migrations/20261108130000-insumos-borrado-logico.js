'use strict';

// Borrado lógico de insumos: "eliminar" completa deletedAt en vez de borrar la fila.
// Antes, al borrar un insumo, la base borraba en cascada sus movimientos de stock (se perdía el historial).
//
// El nombre era único en toda la tabla: con borrado lógico, la fila eliminada seguiría ocupando el nombre
// y no se podría crear otro insumo igual. Ahora es único solo entre los NO eliminados (índice parcial).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Insumos', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      }, { transaction });

      await queryInterface.sequelize.query(
        'ALTER TABLE "Insumos" DROP CONSTRAINT IF EXISTS "Insumos_nombre_key"',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX "insumos_nombre_no_eliminado" ON "Insumos" (nombre) WHERE "deletedAt" IS NULL',
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS "insumos_nombre_no_eliminado"', { transaction });
      await queryInterface.sequelize.query(
        'ALTER TABLE "Insumos" ADD CONSTRAINT "Insumos_nombre_key" UNIQUE (nombre)',
        { transaction }
      );
      await queryInterface.removeColumn('Insumos', 'deletedAt', { transaction });
    });
  },
};