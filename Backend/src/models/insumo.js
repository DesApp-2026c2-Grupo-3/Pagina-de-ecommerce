'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Insumo extends Model {
    static associate(models) {
      Insumo.hasMany(models.StockSucursal, {
        foreignKey: 'insumoId'
      });
      
      Insumo.hasMany(models.RecetaInsumo, {
        foreignKey: 'insumoId'
      });
    }
  }

  Insumo.init({
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
    unidadMedida: { type: DataTypes.STRING, allowNull: false },
    precioComercial: { type: DataTypes.DECIMAL, allowNull: true }
  }, {
    sequelize,
    modelName: 'Insumo',
  });

  return Insumo;
};
