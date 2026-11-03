'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MenuSeccion extends Model {
    static associate(models) {
      MenuSeccion.belongsTo(models.MenuGrupo, { foreignKey: 'grupoId', as: 'grupo' });
      MenuSeccion.belongsTo(models.Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
      MenuSeccion.hasMany(models.MenuSeccionProducto, { foreignKey: 'seccionId', as: 'productos', onDelete: 'CASCADE' });
    }
  }

  MenuSeccion.init({
    grupoId: { type: DataTypes.INTEGER, allowNull: false },
    slug: { type: DataTypes.STRING(40), allowNull: false },
    nombre: { type: DataTypes.STRING(40), allowNull: false },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    icono: { type: DataTypes.STRING(20), allowNull: true },
    fondo: { type: DataTypes.STRING(20), allowNull: true },
    categoriaId: { type: DataTypes.INTEGER, allowNull: true },
    esPorDefecto: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { sequelize, modelName: 'MenuSeccion', tableName: 'MenuSecciones' });

  return MenuSeccion;
};
