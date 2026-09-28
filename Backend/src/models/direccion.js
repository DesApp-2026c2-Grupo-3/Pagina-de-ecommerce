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
    Direccion.hasMany(models.Pedido, {
      foreignKey: 'direccionId'
    });
  }
  }
  Direccion.init({
    alias: DataTypes.STRING,
    calle: DataTypes.STRING,
    numero: DataTypes.STRING,
    piso: DataTypes.STRING,
    localidad: DataTypes.STRING,
    provincia: DataTypes.STRING,
    codigoPostal: DataTypes.STRING,
    entreCalles: DataTypes.STRING,
    observaciones: DataTypes.STRING(140),
    latitud: DataTypes.DECIMAL(10, 7),
    longitud: DataTypes.DECIMAL(10, 7),
    predeterminada: DataTypes.BOOLEAN,
    usuarioId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Direccion',
  });
  return Direccion;
};