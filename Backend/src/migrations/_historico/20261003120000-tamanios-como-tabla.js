'use strict';

// Los tamaños dejan de ser texto suelto y pasan a una tabla propia (Tamanios),
// referenciada por id desde ProductoTamanios (antes ProductoVariantes) y DetallePedidos.
// Además prepara dos columnas nuevas:
//  - DetallePedidos.combo: lo que eligió el cliente en un combo (acompañamiento y bebida).
//  - RecetaInsumos.grupoCombo: qué insumos de un combo son "lugares" elegibles.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (texto) => queryInterface.sequelize.query(texto, { transaction });
      const ahora = new Date();

      // 1. Tabla de tamaños, con regular = 1, mediano = 2, grande = 3
      await queryInterface.createTable('Tamanios', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        nombre: { type: Sequelize.STRING, allowNull: false, unique: true },
        orden: { type: Sequelize.INTEGER, allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // Se insertan de a uno, en orden, para que los ids sean 1, 2 y 3
      for (const [orden, nombre] of ['regular', 'mediano', 'grande'].entries()) {
        await queryInterface.bulkInsert('Tamanios', [
          { nombre, orden: orden + 1, createdAt: ahora, updatedAt: ahora },
        ], { transaction });
      }

      // 2. ProductoVariantes pasa a ser ProductoTamanios y referencia a Tamanios por id
      await queryInterface.renameTable('ProductoVariantes', 'ProductoTamanios', { transaction });
      await queryInterface.addColumn('ProductoTamanios', 'tamanioId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Tamanios', key: 'id' },
        onDelete: 'RESTRICT',
      }, { transaction });
      await sql(`UPDATE "ProductoTamanios" pt SET "tamanioId" = t.id FROM "Tamanios" t WHERE t.nombre = pt.tamanio`);
      await queryInterface.changeColumn('ProductoTamanios', 'tamanioId', {
        type: Sequelize.INTEGER,
        allowNull: false,
      }, { transaction });
      await queryInterface.removeConstraint('ProductoTamanios', 'producto_variante_unica', { transaction });
      await queryInterface.removeColumn('ProductoTamanios', 'tamanio', { transaction });
      await queryInterface.addConstraint('ProductoTamanios', {
        fields: ['productoId', 'tamanioId'],
        type: 'unique',
        name: 'producto_tamanio_unico',
        transaction,
      });

      // Cuánto stock consume cada tamaño respecto de la receta (1 = tal cual)
      await queryInterface.addColumn('ProductoTamanios', 'factorStock', {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 1,
      }, { transaction });

      // 3. Cada línea de un pedido guarda el id del tamaño y, si es combo, sus elecciones
      await queryInterface.addColumn('DetallePedidos', 'tamanioId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Tamanios', key: 'id' },
        onDelete: 'RESTRICT',
      }, { transaction });
      await sql(`UPDATE "DetallePedidos" d SET "tamanioId" = t.id FROM "Tamanios" t WHERE t.nombre = d.tamanio`);
      await queryInterface.removeColumn('DetallePedidos', 'tamanio', { transaction });
      await queryInterface.addColumn('DetallePedidos', 'combo', {
        type: Sequelize.JSON,
        allowNull: true,
      }, { transaction });

      // 4. Insumos de un combo que son un "lugar" elegible (acompañamiento / bebida)
      await queryInterface.addColumn('RecetaInsumos', 'grupoCombo', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (texto) => queryInterface.sequelize.query(texto, { transaction });

      await queryInterface.removeColumn('RecetaInsumos', 'grupoCombo', { transaction });

      await queryInterface.removeColumn('DetallePedidos', 'combo', { transaction });
      await queryInterface.addColumn('DetallePedidos', 'tamanio', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
      await sql(`UPDATE "DetallePedidos" d SET tamanio = t.nombre FROM "Tamanios" t WHERE t.id = d."tamanioId"`);
      await queryInterface.removeColumn('DetallePedidos', 'tamanioId', { transaction });

      await queryInterface.removeColumn('ProductoTamanios', 'factorStock', { transaction });
      await queryInterface.removeConstraint('ProductoTamanios', 'producto_tamanio_unico', { transaction });
      await queryInterface.addColumn('ProductoTamanios', 'tamanio', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
      await sql(`UPDATE "ProductoTamanios" pt SET tamanio = t.nombre FROM "Tamanios" t WHERE t.id = pt."tamanioId"`);
      await queryInterface.changeColumn('ProductoTamanios', 'tamanio', {
        type: Sequelize.STRING,
        allowNull: false,
      }, { transaction });
      await queryInterface.removeColumn('ProductoTamanios', 'tamanioId', { transaction });
      await queryInterface.addConstraint('ProductoTamanios', {
        fields: ['productoId', 'tamanio'],
        type: 'unique',
        name: 'producto_variante_unica',
        transaction,
      });
      await queryInterface.renameTable('ProductoTamanios', 'ProductoVariantes', { transaction });

      await queryInterface.dropTable('Tamanios', { transaction });
    });
  },
};
