'use strict';

// Menú del catálogo editable desde el panel (antes estaba fijo en el front: Frontend/src/config/gruposCatalogo.ts).
//
//  - MenuGrupos: los botones principales (Combos, Hamburguesas, Para acompañar...). "slug" es el que usan
//    las URLs (?grupo=) y los banners del Home.
//  - MenuGrupoCategorias: qué categorías entran en cada grupo (incluida la principal, como Cafetería).
//  - MenuSecciones: los botones de subcategoría de un grupo (Carne de Res, Pollo...), con su ícono y color.
//    categoriaId = todos los productos de esa categoría entran solos; esPorDefecto = donde caen los productos
//    del grupo que ninguna sección reclama (productos nuevos).
//  - MenuSeccionProductos: productos puestos a mano en una sección; en su grupo, lo manual gana sobre la categoría.
//    Un producto puede estar en varias secciones (Brownie en Dulces y en Tortas).
//
// Los datos de hoy los carga la semilla 20261102120000-menu-inicial.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const id = { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false };
      const timestamps = {
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      };
      const referencia = (tabla, onDelete) => ({
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: tabla, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete,
      });

      await queryInterface.createTable('MenuGrupos', {
        id,
        slug: { type: Sequelize.STRING(40), allowNull: false, unique: true },
        nombre: { type: Sequelize.STRING(40), allowNull: false },
        orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        // true = "Todo" se muestra dividido en una sección por subcategoría, sin paginación
        porSecciones: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        ...timestamps,
      }, { transaction });

      await queryInterface.createTable('MenuGrupoCategorias', {
        id,
        grupoId: referencia('MenuGrupos', 'CASCADE'),
        categoriaId: referencia('Categoria', 'CASCADE'),
        ...timestamps,
      }, { transaction });
      await queryInterface.addConstraint('MenuGrupoCategorias', {
        fields: ['grupoId', 'categoriaId'], type: 'unique', name: 'menu_grupo_categoria_unica', transaction,
      });

      await queryInterface.createTable('MenuSecciones', {
        id,
        grupoId: referencia('MenuGrupos', 'CASCADE'),
        slug: { type: Sequelize.STRING(40), allowNull: false },
        nombre: { type: Sequelize.STRING(40), allowNull: false },
        orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        // Ícono y color del título de la sección (null = genérico)
        icono: { type: Sequelize.STRING(20), allowNull: true },
        fondo: { type: Sequelize.STRING(20), allowNull: true },
        categoriaId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Categoria', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        esPorDefecto: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        ...timestamps,
      }, { transaction });
      await queryInterface.addConstraint('MenuSecciones', {
        fields: ['grupoId', 'slug'], type: 'unique', name: 'menu_seccion_slug_unico', transaction,
      });

      await queryInterface.createTable('MenuSeccionProductos', {
        id,
        seccionId: referencia('MenuSecciones', 'CASCADE'),
        productoId: referencia('Productos', 'CASCADE'),
        orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps,
      }, { transaction });
      await queryInterface.addConstraint('MenuSeccionProductos', {
        fields: ['seccionId', 'productoId'], type: 'unique', name: 'menu_seccion_producto_unico', transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('MenuSeccionProductos');
    await queryInterface.dropTable('MenuSecciones');
    await queryInterface.dropTable('MenuGrupoCategorias');
    await queryInterface.dropTable('MenuGrupos');
  },
};
