'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Producto extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      Producto.hasMany(models.DetallePedido, {
        foreignKey: 'productoId'
      });
    }
  }
  Producto.init({
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: {type: DataTypes.TEXT, allowNull: false },
    precio: { type: DataTypes.DECIMAL, allowNull: false },
    imagen: { type: DataTypes.STRING, allowNull: true },
    disponible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Producto',
  });
  return Producto;
};