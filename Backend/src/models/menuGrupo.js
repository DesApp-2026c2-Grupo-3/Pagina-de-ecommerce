'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MenuGrupo extends Model {
    static associate(models) {
      MenuGrupo.hasMany(models.MenuGrupoCategoria, { foreignKey: 'grupoId', as: 'categorias', onDelete: 'CASCADE' });
      MenuGrupo.hasMany(models.MenuSeccion, { foreignKey: 'grupoId', as: 'secciones', onDelete: 'CASCADE' });
    }
  }

  MenuGrupo.init({
    slug: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(40), allowNull: false },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    porSecciones: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { sequelize, modelName: 'MenuGrupo', tableName: 'MenuGrupos' });

  return MenuGrupo;
};
