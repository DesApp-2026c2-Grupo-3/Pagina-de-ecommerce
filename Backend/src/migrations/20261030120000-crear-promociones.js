'use strict';

// Promociones administrables (antes vivían fijas en config/promociones.js).
//
//  - Promociones: la promo en sí. "tipo" dice dónde se muestra:
//      SEMANA = producto de la semana (grande, arriba de la página de Promos; solo una activa)
//      REGALO = regalo de la semana (franja amarilla; solo uno activo)
//      DIA    = promos de cada día (hasta 3 activas por día; "dias" = 0 domingo … 6 sábado)
//  - PromocionItems: qué productos suma al carrito (por id de producto), cuántas unidades y con qué descuento
//      (descuento: 0.2 = 20 % menos, 0.5 = mitad de precio, 1 = gratis, 0 = va a precio de lista).
//
// Los datos de las promos que ya existían los carga la semilla 20261030120000-promociones-iniciales.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const id = { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false };
      const timestamps = {
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      };

      await queryInterface.createTable('Promociones', {
        id,
        tipo: { type: Sequelize.STRING(10), allowNull: false },
        titulo: { type: Sequelize.STRING(60), allowNull: false },
        // Lo grande del círculo de la promo: "2×1", "20%", "Gratis"
        destacado: { type: Sequelize.STRING(10), allowNull: false },
        detalle: { type: Sequelize.STRING(200), allowNull: false },
        // Solo las promos del día: días en que vale (0 = domingo … 6 = sábado)
        dias: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: true },
        // Cuántas veces se puede pedir en un mismo pedido (vacío = sin límite)
        maxPorPedido: { type: Sequelize.INTEGER, allowNull: true },
        // El resto del pedido (sin esta promo) tiene que sumar al menos esto, en pesos
        compraMinima: { type: Sequelize.INTEGER, allowNull: true },
        // Apagar una promo sin borrarla
        activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        ...timestamps,
      }, { transaction });

      await queryInterface.createTable('PromocionItems', {
        id,
        promocionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Promociones', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        productoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Productos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        cantidad: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        descuento: { type: Sequelize.DECIMAL(4, 3), allowNull: false, defaultValue: 0 },
        // Orden en que se muestran los productos de la promo
        orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        ...timestamps,
      }, { transaction });

      await queryInterface.addConstraint('PromocionItems', {
        fields: ['promocionId', 'productoId'],
        type: 'unique',
        name: 'promocion_item_producto_unico',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PromocionItems');
    await queryInterface.dropTable('Promociones');
  },
};
