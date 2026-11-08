'use strict';
const { Model } = require('sequelize');

// Aviso para un administrador (la campanita del panel). Está sin leer mientras leidaEn sea null.
module.exports = (sequelize, DataTypes) => {
  class Notificacion extends Model {
    static associate(models) {
      Notificacion.belongsTo(models.Admin, { as: 'destinatario', foreignKey: 'destinatarioId' });
      Notificacion.belongsTo(models.Parte, { foreignKey: 'parteId' });
    }
  }

  Notificacion.init({
    destinatarioId: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.STRING(20), allowNull: false },
    titulo: { type: DataTypes.STRING(120), allowNull: false },
    mensaje: { type: DataTypes.STRING(300), allowNull: false },
    parteId: { type: DataTypes.INTEGER, allowNull: true },
    leidaEn: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'Notificacion',
    tableName: 'Notificaciones',
  });

  return Notificacion;
};
