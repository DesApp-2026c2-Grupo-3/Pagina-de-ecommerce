'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ComboGrupo extends Model {
    static associate(models) {
      ComboGrupo.belongsTo(models.Producto, { foreignKey: 'productoId', as: 'combo' });
      ComboGrupo.belongsTo(models.Producto, { foreignKey: 'productoIncluidoId', as: 'productoIncluido' });
      ComboGrupo.belongsTo(models.Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
    }
  }

  ComboGrupo.init({
    productoId: { type: DataTypes.INTEGER, allowNull: false },
    // Ej: "Acompañamiento", "Una bebida"
    nombre: { type: DataTypes.STRING, allowNull: false },
    // El cliente elige un producto de esta categoría
    categoriaId: { type: DataTypes.INTEGER, allowNull: false },
    // Opción incluida en el precio del combo; las demás cobran la diferencia de precio
    productoIncluidoId: { type: DataTypes.INTEGER, allowNull: true },
    obligatorio: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    icono: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: 'ComboGrupo',
    tableName: 'ComboGrupos',
  });

  return ComboGrupo;
};
