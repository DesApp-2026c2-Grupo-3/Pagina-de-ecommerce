'use strict';

// Ícono y color de la tarjeta de cada categoría, editables desde el panel. Hasta ahora el front los
// elegía por el NOMBRE de la categoría (si el master la renombraba, perdía el ícono).
// null = sigue valiendo el que corresponde al nombre, así las categorías existentes no cambian.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Categoria', 'icono', { type: Sequelize.STRING(20), allowNull: true }, { transaction });
      await queryInterface.addColumn('Categoria', 'fondo', { type: Sequelize.STRING(20), allowNull: true }, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Categoria', 'fondo');
    await queryInterface.removeColumn('Categoria', 'icono');
  },
};
