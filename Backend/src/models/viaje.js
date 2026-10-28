
'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Viaje extends Model {
    static associate(models) {
      Viaje.belongsTo(models.Repartidor, {
        foreignKey: 'repartidorId',
      });

      Viaje.hasMany(models.Pedido, {
        foreignKey: 'viajeId',
      });
    }
  }

  Viaje.init({
    repartidorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fechaFin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'activo',
    },
  }, {
    sequelize,
    modelName: 'Viaje',
  });

  return Viaje;
};
