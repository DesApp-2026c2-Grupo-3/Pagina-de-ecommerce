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
      
      DetallePedido.belongsTo(models.Pedido, {
        foreignKey: 'pedidoId'
    });
      DetallePedido.belongsTo(models.Producto, {
        foreignKey: 'productoId'
      });
  }
}
  DetallePedido.init({
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    precio: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    tamanio: { type: DataTypes.STRING, allowNull: true },

    // Insumos cuya cantidad final difiere de la receta base: [{ insumoId, cantidad }].
    // Si la cantidad final es menor a la base fue "sacado/reducido" (no cambia el precio);
    // si es mayor, el excedente ya está incluido en "precio" (precioComercial del insumo).
    personalizaciones: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
  }
  }, {
    sequelize,
    modelName: 'DetallePedido',
  });
  return DetallePedido;
};