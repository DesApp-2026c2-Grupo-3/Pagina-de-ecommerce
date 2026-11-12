'use strict';

// Categorías con un nivel de anidación y orden propio. Las principales son los botones del menú
// (y las tarjetas del Home); sus hijas, el submenú (ej: Hamburguesas → de carne, de pollo, veganas).
//
//  - categoriaPadreId: la categoría de la que cuelga (null = categoría principal). Solo un nivel.
//  - orden: orden en que se muestran. Las existentes arrancan con el orden que ya tenían (por id, de a 10).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Categoria', 'categoriaPadreId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Categoria', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      }, { transaction });

      await queryInterface.addColumn('Categoria', 'orden', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }, { transaction });

      // El orden de hoy (por id) pasa a ser explícito, dejando lugar entre una y otra
      await queryInterface.sequelize.query('UPDATE "Categoria" SET orden = id * 10', { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Categoria', 'orden');
    await queryInterface.removeColumn('Categoria', 'categoriaPadreId');
  },
};
