'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecetaInsumo extends Model {
    static associate(models) {
      RecetaInsumo.belongsTo(models.Producto, {
        foreignKey: 'productoId'
      });
      RecetaInsumo.belongsTo(models.Insumo, {
        foreignKey: 'insumoId'
      });
    }
  }

  RecetaInsumo.init({
    productoId: { type: DataTypes.INTEGER, allowNull: false },
    insumoId: { type: DataTypes.INTEGER, allowNull: false },
    cantidadBase: { type: DataTypes.DECIMAL, allowNull: false },
    esRemovible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    esAgregable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
    sequelize,
    modelName: 'RecetaInsumo',
  });

  return RecetaInsumo;
};
