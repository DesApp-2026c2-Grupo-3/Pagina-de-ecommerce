'use strict';
const { Model } = require('sequelize');

// Parte que un empleado le da a los encargados de su sucursal (equipo roto, falta de insumo, problema con un pedido...).
// Estados: ENVIADO → VISTO (lo abre un encargado) → RESUELTO (con una nota opcional).
module.exports = (sequelize, DataTypes) => {
  class Parte extends Model {
    static associate(models) {
      Parte.belongsTo(models.Sucursal, { foreignKey: 'sucursalId' });
      Parte.belongsTo(models.Admin, { as: 'creadoPor', foreignKey: 'creadoPorId' });
      Parte.belongsTo(models.Admin, { as: 'vistoPor', foreignKey: 'vistoPorId' });
      Parte.belongsTo(models.Admin, { as: 'resueltoPor', foreignKey: 'resueltoPorId' });
    }
  }

  Parte.init({
    sucursalId: { type: DataTypes.INTEGER, allowNull: false },
    creadoPorId: { type: DataTypes.INTEGER, allowNull: true },
    tipo: { type: DataTypes.STRING(10), allowNull: false },
    descripcion: { type: DataTypes.STRING(300), allowNull: false },
    urgencia: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'NORMAL' },
    productoIds: { type: DataTypes.JSONB, allowNull: true },
    pedidoId: { type: DataTypes.INTEGER, allowNull: true },
    estado: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'ENVIADO' },
    vistoPorId: { type: DataTypes.INTEGER, allowNull: true },
    vistoEn: { type: DataTypes.DATE, allowNull: true },
    resueltoPorId: { type: DataTypes.INTEGER, allowNull: true },
    resueltoEn: { type: DataTypes.DATE, allowNull: true },
    nota: { type: DataTypes.STRING(200), allowNull: true },
  }, {
    sequelize,
    modelName: 'Parte',
    tableName: 'Partes',
  });

  return Parte;
};
