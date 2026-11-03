'use strict';

// Categorías con un nivel de anidación (para que el Home junte Café y Menú Café bajo "Cafetería"),
// orden propio y marca de "complemento" (las salsas: no cuentan en el ranking ni se sugieren en el carrito).
//
//  - categoriaPadreId: la categoría de la que cuelga (null = categoría principal). Solo un nivel.
//  - orden: orden en que se muestran. Las existentes arrancan con el orden que ya tenían (por id, de a 10).
//  - esComplemento: se pide como agregado de otra comida; tiene tope por pedido y no puede ser todo el pedido.
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

      await queryInterface.addColumn('Categoria', 'esComplemento', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }, { transaction });

      // El orden de hoy (por id) pasa a ser explícito, dejando lugar entre una y otra
      await queryInterface.sequelize.query('UPDATE "Categoria" SET orden = id * 10', { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Categoria', 'esComplemento');
    await queryInterface.removeColumn('Categoria', 'orden');
    await queryInterface.removeColumn('Categoria', 'categoriaPadreId');
  },
};
