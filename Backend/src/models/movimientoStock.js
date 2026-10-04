'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MovimientoStock extends Model {
    static associate(models) {
      MovimientoStock.belongsTo(models.Insumo, { foreignKey: 'insumoId' });
      MovimientoStock.belongsTo(models.Sucursal, { foreignKey: 'sucursalId' });
      MovimientoStock.belongsTo(models.Admin, { foreignKey: 'adminId' });
    }
  }

  MovimientoStock.init({
    sucursalId: { type: DataTypes.INTEGER, allowNull: false },
    insumoId: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
    cantidad: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    cantidadAnterior: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    cantidadNueva: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    motivo: { type: DataTypes.STRING, allowNull: true },
    detalle: { type: DataTypes.STRING(200), allowNull: true },
    adminId: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    sequelize,
    modelName: 'MovimientoStock',
    tableName: 'MovimientoStocks',
  });

  return MovimientoStock;
};