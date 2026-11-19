'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PromocionItem extends Model {
    static associate(models) {
      PromocionItem.belongsTo(models.Promocion, { foreignKey: 'promocionId', as: 'promocion' });
      // Los productos tienen borrado lógico: si se elimina uno, la promo deja de ofrecerse
      PromocionItem.belongsTo(models.Producto, { foreignKey: 'productoId', as: 'producto' });
    }
  }

  PromocionItem.init({
    promocionId: { type: DataTypes.INTEGER, allowNull: false },
    productoId: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    // 0.2 = 20 % menos, 0.5 = mitad de precio, 1 = gratis, 0 = precio de lista (Postgres devuelve el DECIMAL como texto)
    descuento: {
      type: DataTypes.DECIMAL(4, 3),
      allowNull: false,
      defaultValue: 0,
      get() {
        return Number(this.getDataValue('descuento'));
      },
    },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  }, {
    sequelize,
    modelName: 'PromocionItem',
    tableName: 'PromocionItems',
  });

  return PromocionItem;
};
