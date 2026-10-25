'use strict';

// Cada tamaño (regular, mediano, grande) pasa a tener una imagen representativa.
// El selector de tamaño de los combos la muestra a la izquierda de cada opción.
// La columna queda vacía hasta que corra la semilla 20261021120000-restaurar-menu-y-salsas
// (que carga las rutas /imagenes/Formatos/Formato-*.png); los archivos se agregan a mano.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Tamanios', 'imagen', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Tamanios', 'imagen');
  },
};
