'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pedido extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Pedido.hasMany(models.DetallePedido, {
        foreignKey: 'pedidoId'
      });
      
      Pedido.belongsTo(models.Usuario, {
       foreignKey: 'usuarioId'
      });
    }
  }
  Pedido.init({
    fecha: DataTypes.DATE,
    total: DataTypes.DECIMAL,
    estado: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Pedido',
  });
  return Pedido;
};