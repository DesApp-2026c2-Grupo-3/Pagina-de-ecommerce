'use strict';

// Retira "La Bestialidad" del catálogo mediante borrado lógico y asigna
// al "Combo Modo Bestia" la imagen renombrada Combo-Modo-Bestia.png.
// No elimina filas ni modifica pedidos históricos.

const PRODUCTO_A_RETIRAR = {
  id: 15,
  nombre: 'La Bestialidad',
};

const PRODUCTO_A_ACTUALIZAR = {
  id: 40,
  nombre: 'Combo Modo Bestia',
  imagenNueva: '/imagenes/Combos/Combo-Modo-Bestia.png',
  // Valor anterior según el CSV compartido (antes del seeder de imágenes).
  imagenAnterior: '',
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [retirar] = await queryInterface.sequelize.query(
        'SELECT id, nombre FROM "Productos" WHERE id = :id AND nombre = :nombre',
        {
          replacements: PRODUCTO_A_RETIRAR,
          transaction,
        }
      );

      if (retirar.length !== 1) {
        throw new Error(
          `No se encontró el producto esperado para retirar: id=${PRODUCTO_A_RETIRAR.id}, nombre="${PRODUCTO_A_RETIRAR.nombre}".`
        );
      }

      const [comboModoBestia] = await queryInterface.sequelize.query(
        'SELECT id, nombre FROM "Productos" WHERE id = :id AND nombre = :nombre',
        {
          replacements: {
            id: PRODUCTO_A_ACTUALIZAR.id,
            nombre: PRODUCTO_A_ACTUALIZAR.nombre,
          },
          transaction,
        }
      );

      if (comboModoBestia.length !== 1) {
        throw new Error(
          `No se encontró el producto esperado para actualizar: id=${PRODUCTO_A_ACTUALIZAR.id}, nombre="${PRODUCTO_A_ACTUALIZAR.nombre}".`
        );
      }

      await queryInterface.sequelize.query(
        `UPDATE "Productos"
         SET "deletedAt" = COALESCE("deletedAt", NOW()), "updatedAt" = NOW()
         WHERE id = :id AND nombre = :nombre`,
        {
          replacements: PRODUCTO_A_RETIRAR,
          transaction,
        }
      );

      await queryInterface.sequelize.query(
        `UPDATE "Productos"
         SET imagen = :imagen, "updatedAt" = NOW()
         WHERE id = :id AND nombre = :nombre`,
        {
          replacements: {
            id: PRODUCTO_A_ACTUALIZAR.id,
            nombre: PRODUCTO_A_ACTUALIZAR.nombre,
            imagen: PRODUCTO_A_ACTUALIZAR.imagenNueva,
          },
          transaction,
        }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Revierte la ruta de imagen al valor previo registrado en el CSV.
      await queryInterface.sequelize.query(
        `UPDATE "Productos"
         SET imagen = :imagen, "updatedAt" = NOW()
         WHERE id = :id AND nombre = :nombre`,
        {
          replacements: {
            id: PRODUCTO_A_ACTUALIZAR.id,
            nombre: PRODUCTO_A_ACTUALIZAR.nombre,
            imagen: PRODUCTO_A_ACTUALIZAR.imagenAnterior,
          },
          transaction,
        }
      );

      // Reactiva el producto retirado, sin tocar sus datos ni sus relaciones.
      await queryInterface.sequelize.query(
        `UPDATE "Productos"
         SET "deletedAt" = NULL, "updatedAt" = NOW()
         WHERE id = :id AND nombre = :nombre`,
        {
          replacements: PRODUCTO_A_RETIRAR,
          transaction,
        }
      );
    });
  },
};
