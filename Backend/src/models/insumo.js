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
    // Único entre los insumos no eliminados (lo controla un índice de la migración insumos-borrado-logico)
    nombre: { type: DataTypes.STRING, allowNull: false },    
    unidadMedida: { type: DataTypes.STRING, allowNull: false },
    precioComercial: { type: DataTypes.DECIMAL, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true}
  }, {
    sequelize,
    modelName: 'Insumo',
    // Borrado lógico: destroy() completa deletedAt. El historial de stock lo busca con paranoid: false.
    paranoid: true,
  });

  return Insumo;
};
