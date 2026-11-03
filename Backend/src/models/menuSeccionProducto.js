'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MenuSeccionProducto extends Model {
    static associate(models) {
      MenuSeccionProducto.belongsTo(models.MenuSeccion, { foreignKey: 'seccionId', as: 'seccion' });
      MenuSeccionProducto.belongsTo(models.Producto, { foreignKey: 'productoId', as: 'producto' });
    }
  }

  MenuSeccionProducto.init({
    seccionId: { type: DataTypes.INTEGER, allowNull: false },
    productoId: { type: DataTypes.INTEGER, allowNull: false },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, { sequelize, modelName: 'MenuSeccionProducto', tableName: 'MenuSeccionProductos' });

  return MenuSeccionProducto;
};
