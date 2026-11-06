
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
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    fechaFin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'preparando',
    },
     motivoAsistencia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    comentarioAsistencia: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fechaSolicitudAsistencia: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Viaje',
  });

  return Viaje;
};
