'use strict';

// "Nuevo en la carta" (página de Promos): el producto que se presenta como lanzamiento.
// Antes estaba fijo en el front (buscaba "Combo Abominación" por nombre); ahora lo elige el
// Admin-Master desde Promociones y se guarda en Parámetros. Sin producto, el bloque no se muestra.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Parametros', 'productoNuevoId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }, { transaction });

      // Para que la tienda siga mostrando lo mismo que hoy
      await queryInterface.sequelize.query(
        `UPDATE "Parametros" SET "productoNuevoId" = (
           SELECT id FROM "Productos" WHERE nombre = 'Combo Abominación' AND "deletedAt" IS NULL LIMIT 1
         )`,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Parametros', 'productoNuevoId');
  },
};
