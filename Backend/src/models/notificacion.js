'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notificacion extends Model {
    static associate(models) {
      Notificacion.hasMany(models.NotificacionDestinatario, {
        foreignKey: 'notificacionId',
        as: 'destinatarios',
        onDelete: 'CASCADE',
      });
    }
  }

  Notificacion.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    tipo: { type: DataTypes.STRING, allowNull: false },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    datos: { type: DataTypes.JSONB, allowNull: false },
    destinos: { type: DataTypes.JSONB, allowNull: false },
    ocurridoEn: { type: DataTypes.DATE, allowNull: false },
  }, {
    sequelize,
    modelName: 'Notificacion',
    tableName: 'notificaciones',
    underscored: true,
  });

  return Notificacion;
};
