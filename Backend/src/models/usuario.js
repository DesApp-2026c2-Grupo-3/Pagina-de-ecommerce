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
      Usuario.hasMany(models.Direccion, {
        foreignKey: 'usuarioId'
      });
      Usuario.belongsTo(models.Sucursal, {
        foreignKey: 'sucursalId'
      });

    }
  }
Usuario.init({
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING, allowNull: true },
  dni: { type: DataTypes.STRING, allowNull: true },
  fechaNacimiento: { type: DataTypes.DATEONLY, allowNull: true },
  sucursalId: { type: DataTypes.INTEGER, allowNull: true },
}, {
  sequelize,
  modelName: 'Usuario',
})
  return Usuario;
};