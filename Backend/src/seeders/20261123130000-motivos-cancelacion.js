'use strict';

// Motivos de cancelación para los pedidos cancelados que no tienen (los de la historia de ventas
// se cargaron antes de que existiera el motivo). Así el ranking de motivos de los reportes tiene datos.
// Corre después de 20261107130000-ventas-historia y de la migración 20261123120000-pedidos-motivo-cancelacion.
//
// Siempre reparte igual (según el id del pedido), con más peso en los motivos más comunes.
// Son los mismos textos que los atajos del panel al cancelar un pedido.
// Es re-ejecutable: solo completa los que no tienen motivo. El down borra solo los que puso.

const MOTIVOS = [
  // [texto, peso sobre 10]
  ['Nos quedamos sin stock de un producto del pedido', 4],
  ['Demora en la cocina por alta demanda', 2],
  ['No podemos entregar en tu dirección en este momento', 2],
  ['No conseguimos un repartidor disponible', 1],
  ['El local tuvo que cerrar antes de lo previsto', 1],
];

// Cada resto (0 a 9) del id cae en un motivo, según su peso
const POR_RESTO = MOTIVOS.flatMap(([texto, peso]) => Array(peso).fill(texto));

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      for (let resto = 0; resto < POR_RESTO.length; resto++) {
        await sequelize.query(
          `UPDATE "Pedidos" SET "motivoCancelacion" = :motivo
           WHERE estado ILIKE 'cancelado' AND "motivoCancelacion" IS NULL AND MOD(id, 10) = :resto`,
          { replacements: { motivo: POR_RESTO[resto], resto }, transaction }
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE "Pedidos" SET "motivoCancelacion" = NULL WHERE "motivoCancelacion" IN (:motivos)`,
      { replacements: { motivos: MOTIVOS.map(([texto]) => texto) } }
    );
  },
};
