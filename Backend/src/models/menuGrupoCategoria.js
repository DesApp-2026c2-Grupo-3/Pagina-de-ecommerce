'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MenuGrupoCategoria extends Model {
    static associate(models) {
      MenuGrupoCategoria.belongsTo(models.MenuGrupo, { foreignKey: 'grupoId', as: 'grupo' });
      MenuGrupoCategoria.belongsTo(models.Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
    }
  }

  MenuGrupoCategoria.init({
    grupoId: { type: DataTypes.INTEGER, allowNull: false },
    categoriaId: { type: DataTypes.INTEGER, allowNull: false },
  }, { sequelize, modelName: 'MenuGrupoCategoria', tableName: 'MenuGrupoCategorias' });

  return MenuGrupoCategoria;
};
