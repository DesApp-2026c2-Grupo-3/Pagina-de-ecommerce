'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductoTamanio extends Model {
    static associate(models) {
      ProductoTamanio.belongsTo(models.Producto, { foreignKey: 'productoId' });
      ProductoTamanio.belongsTo(models.Tamanio, { foreignKey: 'tamanioId' });
    }
  }

  ProductoTamanio.init({
    productoId: { type: DataTypes.INTEGER, allowNull: false },
    tamanioId: { type: DataTypes.INTEGER, allowNull: false },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    // Texto opcional para mostrar, ej: "354 ml"
    etiqueta: { type: DataTypes.STRING, allowNull: true },
    // Cuánto stock consume este tamaño respecto de la receta base (1 = receta tal cual)
    factorStock: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 1 },
  }, {
    sequelize,
    modelName: 'ProductoTamanio',
    tableName: 'ProductoTamanios',
  });

  return ProductoTamanio;
};
