'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sucursal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Sucursal.hasMany(models.Usuario, {
        foreignKey: 'sucursalId'
      });

      Sucursal.hasMany(models.StockSucursal, {
        foreignKey: 'sucursalId'
      });
    }
  }
  Sucursal.init({
    nombre: { type: DataTypes.STRING, allowNull: false },
    calle: { type: DataTypes.STRING, allowNull: false },
    numero: { type: DataTypes.STRING, allowNull: true },
    localidad: { type: DataTypes.STRING, allowNull: false },
    provincia: { type: DataTypes.STRING, allowNull: false },
    telefono: { type: DataTypes.STRING, allowNull: true },
    horario: { type: DataTypes.STRING, allowNull: true },
    latitud: { type: DataTypes.FLOAT, allowNull: false },
    longitud: { type: DataTypes.FLOAT, allowNull: false },
  }, {
    sequelize,
    modelName: 'Sucursal',
  });
  return Sucursal;
};
