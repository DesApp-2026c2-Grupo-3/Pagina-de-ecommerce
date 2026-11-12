'use strict';

// Moderación: solo las calificaciones APROBADAS se muestran en el inicio.
// PENDIENTE = recién enviada, sin revisar · APROBADA = visible · OCULTA = no se muestra
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Calificaciones', 'estado', {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Calificaciones', 'estado');
  },
};