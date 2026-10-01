'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Cada ADMIN gestiona una sucursal; el MASTER no tiene
      Admin.belongsTo(models.Sucursal, { foreignKey: 'sucursalId' });
    }
  }
  Admin.init({
    nombre: {type:DataTypes.STRING, allowNull: false},
    email: {type:DataTypes.STRING, allowNull:false, unique:true},
    password: {type:DataTypes.STRING, allowNull:false},
    rol: { type: DataTypes.STRING, allowNull:false ,defaultValue: 'ADMIN'},
    sucursalId: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    sequelize,
    modelName: 'Admin',
  });
  return Admin;
};