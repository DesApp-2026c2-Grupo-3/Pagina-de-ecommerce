'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Promocion extends Model {
    static associate(models) {
      Promocion.hasMany(models.PromocionItem, {
        foreignKey: 'promocionId',
        as: 'items',
        onDelete: 'CASCADE',
      });
    }
  }

  Promocion.init({
    // SEMANA (producto de la semana), REGALO (regalo de la semana) o DIA (promos de cada día)
    tipo: { type: DataTypes.STRING(10), allowNull: false },
    titulo: { type: DataTypes.STRING(60), allowNull: false },
    destacado: { type: DataTypes.STRING(10), allowNull: false },
    detalle: { type: DataTypes.STRING(200), allowNull: false },
    // Solo tipo DIA: 0 = domingo … 6 = sábado
    dias: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: true },
    maxPorPedido: { type: DataTypes.INTEGER, allowNull: true },
    compraMinima: { type: DataTypes.INTEGER, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    sequelize,
    modelName: 'Promocion',
    tableName: 'Promociones',
  });

  return Promocion;
};
