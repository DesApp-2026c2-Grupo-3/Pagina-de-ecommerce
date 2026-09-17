'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Usuario.hasMany(models.Pedido, {
    foreignKey: 'usuarioId'
  });

    }
  }
  Usuario.init({
    nombre:{type:DataTypes.STRING, allowNull:false},
    email:{type:DataTypes.STRING, allowNull:false,unique:true},
    password: {type:DataTypes.STRING, allowNull:false},
    telefono: { type: DataTypes.STRING, allowNull: true }, 
    direccion: { type: DataTypes.STRING, allowNull: true }, 
  }, {
    sequelize,
    modelName: 'Usuario',
  });
  return Usuario;
};