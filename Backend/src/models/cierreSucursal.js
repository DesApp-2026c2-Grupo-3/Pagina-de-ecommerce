'use strict';
const { Model } = require('sequelize');

// Cierre temporal de una sucursal por una contingencia (falta de agua o luz, etc.), decidido por su encargado.
// Es independiente del horario semanal y de Sucursal.activa (que es del master). Está cerrada mientras
// reabiertoEn sea null. Reabrir no borra: completa quién y cuándo (queda el historial).
module.exports = (sequelize, DataTypes) => {
  class CierreSucursal extends Model {
    static associate(models) {
      CierreSucursal.belongsTo(models.Sucursal, { foreignKey: 'sucursalId' });
      CierreSucursal.belongsTo(models.Admin, { as: 'cerradoPor', foreignKey: 'cerradoPorId' });
      CierreSucursal.belongsTo(models.Admin, { as: 'reabiertoPor', foreignKey: 'reabiertoPorId' });
    }
  }

  CierreSucursal.init({
    sucursalId: { type: DataTypes.INTEGER, allowNull: false },
    motivo: { type: DataTypes.STRING(200), allowNull: false },
    cerradoPorId: { type: DataTypes.INTEGER, allowNull: true },
    reabiertoPorId: { type: DataTypes.INTEGER, allowNull: true },
    reabiertoEn: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'CierreSucursal',
    tableName: 'CierresSucursales',
  });

  return CierreSucursal;
};
