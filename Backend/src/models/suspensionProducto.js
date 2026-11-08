'use strict';
const { Model } = require('sequelize');

// Un producto que no se vende en una sucursal por decisión de quien la gestiona.
//  - origen ENCARGADO: suspensión transitoria del encargado, con motivo. La levanta el encargado o el master.
//  - origen MASTER: deshabilitación del master en esa sucursal, por tiempo indefinido. Solo el master la levanta.
// Está activa mientras rehabilitadaEn sea null. Rehabilitar no borra: completa la fila (queda el historial).
module.exports = (sequelize, DataTypes) => {
  class SuspensionProducto extends Model {
    static associate(models) {
      SuspensionProducto.belongsTo(models.Producto, { foreignKey: 'productoId' });
      SuspensionProducto.belongsTo(models.Sucursal, { foreignKey: 'sucursalId' });
      SuspensionProducto.belongsTo(models.Admin, { as: 'creadaPor', foreignKey: 'creadaPorId' });
      SuspensionProducto.belongsTo(models.Admin, { as: 'rehabilitadaPor', foreignKey: 'rehabilitadaPorId' });
    }
  }

  SuspensionProducto.init({
    productoId: { type: DataTypes.INTEGER, allowNull: false },
    sucursalId: { type: DataTypes.INTEGER, allowNull: false },
    origen: { type: DataTypes.STRING(10), allowNull: false },
    motivo: { type: DataTypes.STRING(200), allowNull: false },
    creadaPorId: { type: DataTypes.INTEGER, allowNull: true },
    rehabilitadaPorId: { type: DataTypes.INTEGER, allowNull: true },
    rehabilitadaEn: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'SuspensionProducto',
    tableName: 'SuspensionProductos',
  });

  return SuspensionProducto;
};
