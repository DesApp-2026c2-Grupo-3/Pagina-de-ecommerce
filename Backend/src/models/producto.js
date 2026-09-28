'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Producto extends Model {
    static associate(models) {
      Producto.hasMany(models.DetallePedido, {
        foreignKey: 'productoId'
      });

      Producto.belongsTo(models.Categoria, {
        foreignKey: 'categoriaId',
        as: 'categoria'
      });

      Producto.hasMany(models.RecetaInsumo, {
        foreignKey: 'productoId'
      });
    }
  }

  Producto.init({
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    precio: { type: DataTypes.DECIMAL, allowNull: false },
    imagen: { type: DataTypes.STRING, allowNull: true },
    disponible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    categoriaId: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    sequelize,
    modelName: 'Producto',
  });

  return Producto;
};