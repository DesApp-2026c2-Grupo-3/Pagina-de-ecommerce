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
      DetallePedido.belongsTo(models.Tamanio, {
        foreignKey: 'tamanioId'
      });

      // Promo con la que se pidió la línea (si tenía)
      DetallePedido.belongsTo(models.Promocion, {
        foreignKey: 'promocionId',
        as: 'promocion'
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
    // Tamaño elegido (regular, mediano, grande), si el producto tiene tamaños
    tamanioId: { type: DataTypes.INTEGER, allowNull: true },

    
    // Promo con la que se pidió (vacío si no tenía) y precio unitario sin descuento
    promocionId: { type: DataTypes.INTEGER, allowNull: true },
    precioLista: { type: DataTypes.DECIMAL, allowNull: true },
    
    // Si es un combo: { elecciones: [{ grupoId, productoId, recargo }], recargo } con lo que eligió el cliente
    combo: { type: DataTypes.JSON, allowNull: true },

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