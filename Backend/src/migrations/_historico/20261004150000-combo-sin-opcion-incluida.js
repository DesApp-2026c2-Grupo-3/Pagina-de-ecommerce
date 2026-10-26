'use strict';

// La opción incluida de un combo ya no se elige: es siempre la más barata de la categoría
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "ComboGrupos" ALTER COLUMN "productoIncluidoId" DROP NOT NULL;'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "ComboGrupos" ALTER COLUMN "productoIncluidoId" SET NOT NULL;'
    );
  },
};