'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductoVariante extends Model {
    static associate(models) {
      ProductoVariante.belongsTo(models.Producto, { foreignKey: 'productoId' });
    }
  }

  ProductoVariante.init({
    productoId: { type: DataTypes.INTEGER, allowNull: false },
    tamanio: { type: DataTypes.STRING, allowNull: false },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    etiqueta: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: 'ProductoVariante',
    tableName: 'ProductoVariantes',
  });

  return ProductoVariante;
};