'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tamanio extends Model {
    static associate(models) {
      Tamanio.hasMany(models.ProductoTamanio, { foreignKey: 'tamanioId' });
    }
  }

  Tamanio.init({
    // regular, mediano, grande
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
    // Orden para mostrarlos: 1 = regular, 2 = mediano, 3 = grande
    orden: { type: DataTypes.INTEGER, allowNull: false },
    // Imagen representativa del tamaño (ej: /imagenes/Formatos/Formato-Regular.png). Se usa en el selector de combos.
    imagen: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: 'Tamanio',
    tableName: 'Tamanios',
  });

  return Tamanio;
};
