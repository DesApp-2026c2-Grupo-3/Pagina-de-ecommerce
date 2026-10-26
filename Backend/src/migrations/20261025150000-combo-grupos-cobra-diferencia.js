'use strict';

// Cada lugar de un combo decide si cobra la diferencia cuando el cliente elige una opción más cara:
//  - true  (papas): elegir unas papas más caras suma la diferencia al precio del combo.
//  - false (bebidas): cualquier opción cuesta lo mismo; el precio lo define solo el tamaño del combo.
// Los combos que ya existen se ajustan con la semilla 20261025150000-combos-bebidas-sin-recargo.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ComboGrupos', 'cobraDiferencia', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ComboGrupos', 'cobraDiferencia');
  },
};