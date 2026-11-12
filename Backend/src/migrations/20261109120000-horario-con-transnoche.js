'use strict';

// El horario de las sucursales cambió de formato (ver utils/horarioSucursal.js). Esta migración lleva
// los horarios guardados al formato actual: una franja por día ({ abierto, apertura, cierre }) y una transnoche opcional.
// Si ya estaban en el formato actual no los toca. Es la misma conversión que 20261108130000: existe aparte para las bases que
// ya habían corrido esa migración con el formato anterior (dos turnos por día).

const { convertirHorario } = require('../utils/convertirHorario');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [filas] = await queryInterface.sequelize.query('SELECT "id", "horario" FROM "Sucursals"');
    let convertidas = 0;

    for (const fila of filas) {
      const actual = typeof fila.horario === 'string' ? JSON.parse(fila.horario) : fila.horario;
      const nuevo = convertirHorario(actual);
      if (JSON.stringify(nuevo) === JSON.stringify(actual)) continue;

      await queryInterface.sequelize.query(
        'UPDATE "Sucursals" SET "horario" = CAST(:horario AS jsonb), "updatedAt" = NOW() WHERE "id" = :id',
        { replacements: { horario: JSON.stringify(nuevo), id: fila.id } },
      );
      convertidas += 1;
    }

    console.log(`ℹ️  Horarios convertidos: ${convertidas} de ${filas.length} sucursales.`);
  },

  // Los turnos y transnoches no existían antes: no hay vuelta atrás sin perder datos
  async down() {},
};
