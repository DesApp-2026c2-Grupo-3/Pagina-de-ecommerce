'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Calificacion extends Model {
    static associate(models) {
      Calificacion.belongsTo(models.Pedido, { foreignKey: 'pedidoId', as: 'pedido' });
      Calificacion.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
      Calificacion.belongsTo(models.Sucursal, { foreignKey: 'sucursalId', as: 'sucursal' });
    }
  }

  Calificacion.init({
    pedidoId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    sucursalId: { type: DataTypes.INTEGER, allowNull: true },
    // De 1 a 5 estrellas
    puntaje: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    comentario: { type: DataTypes.STRING(300), allowNull: true },
  }, {
    sequelize,
    modelName: 'Calificacion',
    tableName: 'Calificaciones',
  });

  return Calificacion;
};
