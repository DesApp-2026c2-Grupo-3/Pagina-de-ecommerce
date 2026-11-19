'use strict';
const { Model } = require('sequelize');

// Parámetros del negocio: una sola fila (id = 1). Se leen con utils/parametros.js
module.exports = (sequelize, DataTypes) => {
  class Parametro extends Model {}

  Parametro.init({
    // Pedidos
    maxPedidosEnCurso: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    // Entrega
    radioEntregaKm: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 10 },
    envioBase: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 1200 },
    envioPorKm: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 300 },
    // Tiempos (en minutos)
    preparacionBaseMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    preparacionPorProductoMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    viajeMinPorKm: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 4 },
    margenDemoraMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    // Calificaciones
    diasParaCalificar: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 7 },
    opinionesEnInicio: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 6 },
    // Promociones
    maxPromosPorDia: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  }, {
    sequelize,
    modelName: 'Parametro',
    tableName: 'Parametros',
  });

  return Parametro;
};