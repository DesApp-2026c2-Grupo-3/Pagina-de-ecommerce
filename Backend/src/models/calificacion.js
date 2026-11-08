'use strict';
const { Model } = require('sequelize');

// Una calificación es de UN producto de UN pedido: puntaje de 1 a 5 (opcional) y comentario (opcional),
// pero nunca las dos cosas vacías.
module.exports = (sequelize, DataTypes) => {
  class Calificacion extends Model {
    static associate(models) {
      Calificacion.belongsTo(models.Pedido, { foreignKey: 'pedidoId', as: 'pedido' });
      Calificacion.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
      Calificacion.belongsTo(models.Sucursal, { foreignKey: 'sucursalId', as: 'sucursal' });
      Calificacion.belongsTo(models.Producto, { foreignKey: 'productoId', as: 'producto' });
    }
  }

  Calificacion.init({
    pedidoId: { type: DataTypes.INTEGER, allowNull: false },
    productoId: { type: DataTypes.INTEGER, allowNull: false },
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    sucursalId: { type: DataTypes.INTEGER, allowNull: true },
    // De 1 a 5 estrellas; null si el cliente solo dejó un comentario sobre ese producto
    puntaje: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
    comentario: { type: DataTypes.STRING(300), allowNull: true },
  }, {
    sequelize,
    modelName: 'Calificacion',
    tableName: 'Calificaciones',
    // Un producto se califica una sola vez por pedido
    indexes: [{ unique: true, fields: ['pedidoId', 'productoId'], name: 'calificaciones_pedido_producto_unico' }],
    validate: {
      conPuntajeOComentario() {
        if (this.puntaje === null && this.comentario === null) {
          throw new Error('La calificación necesita estrellas o un comentario');
        }
      },
    },
  });

  return Calificacion;
};
