'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DetallePedido extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DetallePedido.init({
    cantidad: DataTypes.INTEGER,
    precio: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'DetallePedido',
  });
  return DetallePedido;
};