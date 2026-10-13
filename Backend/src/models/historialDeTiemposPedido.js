'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class historialDeTiemposPedido extends Model {
    static associate(models) {
      historialDeTiemposPedido.belongsTo(models.Pedido, { foreignKey: 'pedidoId' });
    }
  }

  historialDeTiemposPedido.init({
    pedidoId: { type: DataTypes.INTEGER, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false },
    estadoAnterior: { type: DataTypes.STRING, allowNull: true },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    sequelize,
    modelName: 'historialDeTiemposPedido',
    tableName: 'historialDeTiemposPedido',
    // Registro histórico inmutable: se crea una vez por transición y nunca se edita
    updatedAt: false,
  });

  return historialDeTiemposPedido;
};
