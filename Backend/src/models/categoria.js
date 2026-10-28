'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Categoria extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Categoria.hasMany(models.Producto, {
        foreignKey: 'categoriaId',
        as: 'productos'
      });
    }
    
  }
  Categoria.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
  }, {
    sequelize,
    modelName: 'Categoria',
  });
  return Categoria;
};