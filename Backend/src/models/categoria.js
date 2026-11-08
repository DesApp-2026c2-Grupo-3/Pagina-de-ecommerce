'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Categoria extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Categoria.hasMany(models.Producto, {
        foreignKey: 'categoriaId',
        as: 'productos'
      });
      // Un nivel de anidación: "Cafetería" tiene como hijas a Café y Menú Café
      Categoria.belongsTo(models.Categoria, { foreignKey: 'categoriaPadreId', as: 'padre' });
      Categoria.hasMany(models.Categoria, { foreignKey: 'categoriaPadreId', as: 'hijas' });
    }
    
  }
  Categoria.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
    // null = categoría principal; si no, la categoría de la que cuelga (un solo nivel)
    categoriaPadreId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Orden en que se muestran (de menor a mayor)
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Ícono y color de la tarjeta del Home (null = el que corresponde al nombre)
    icono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    fondo: {
      type: DataTypes.STRING(20),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Categoria',
  });
  return Categoria;
};
