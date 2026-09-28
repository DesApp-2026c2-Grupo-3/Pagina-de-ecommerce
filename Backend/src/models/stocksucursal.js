'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockSucursal extends Model {
    static associate(models) {
      StockSucursal.belongsTo(models.Insumo, {
        foreignKey: 'insumoId'
      });
      StockSucursal.belongsTo(models.Sucursal, {
        foreignKey: 'sucursalId'
      });
    }
  }

  StockSucursal.init({
    insumoId: { type: DataTypes.INTEGER, allowNull: false },
    sucursalId: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    stockMinimo: { type: DataTypes.DECIMAL, allowNull: true }
  }, {
    sequelize,
    modelName: 'StockSucursal',
  });

  return StockSucursal;
};
