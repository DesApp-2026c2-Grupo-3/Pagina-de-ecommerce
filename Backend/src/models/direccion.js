'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Direccion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
  static associate(models) {
    Direccion.belongsTo(models.Usuario, {
      foreignKey: 'usuarioId'
    });
  }
  }
  Direccion.init({
    alias: DataTypes.STRING,
    calle: DataTypes.STRING,
    numero: DataTypes.STRING,
    piso: DataTypes.STRING,
    ciudad: DataTypes.STRING,
    codigoPostal: DataTypes.STRING,
    predeterminada: DataTypes.BOOLEAN,
    usuarioId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Direccion',
  });
  return Direccion;
};