
'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Repartidor extends Model {
    static associate(models) {
      Repartidor.belongsTo(models.Sucursal, {
        foreignKey: 'sucursalId',
      });

      Repartidor.hasMany(models.Viaje, {
        foreignKey: 'repartidorId',
      });
    }
  }

  Repartidor.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sucursalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    sequelize,
    modelName: 'Repartidor',
  });

  return Repartidor;
};
