'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NotificacionDestinatario extends Model {
    static associate(models) {
      NotificacionDestinatario.belongsTo(models.Notificacion, {
        foreignKey: 'notificacionId',
        as: 'notificacion',
      });
    }
  }

  NotificacionDestinatario.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    notificacionId: { type: DataTypes.BIGINT, allowNull: false },
    destinatarioTipo: { type: DataTypes.STRING(10), allowNull: false },
    destinatarioId: { type: DataTypes.INTEGER, allowNull: false },
    leida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    leidaEn: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'NotificacionDestinatario',
    tableName: 'notificacion_destinatarios',
    underscored: true,
    indexes: [
      {
        unique: true,
        name: 'notificacion_destinatario_unico',
        fields: ['notificacion_id', 'destinatario_tipo', 'destinatario_id'],
      },
      {
        name: 'notificacion_destinatarios_bandeja_idx',
        fields: ['destinatario_tipo', 'destinatario_id', 'leida'],
      },
    ],
  });

  return NotificacionDestinatario;
};
