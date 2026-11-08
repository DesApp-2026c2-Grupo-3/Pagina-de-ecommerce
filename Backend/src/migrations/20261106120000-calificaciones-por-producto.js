'use strict';

// Las calificaciones pasan de ser "una por pedido" a "una por producto de cada pedido".
//  - Se agrega productoId y la unicidad pasa a ser (pedidoId, productoId).
//  - puntaje puede ser null: el cliente puede dejar solo un comentario sobre un producto (pero nunca los dos vacíos).
//  - Las calificaciones que ya existían (del pedido completo) se reparten: cada producto calificable del pedido
//    hereda el puntaje, y el comentario queda en el primero. Las salsas gratuitas no se califican.
module.exports = {
  async up(queryInterface, Sequelize) {
    const columnas = await queryInterface.describeTable('Calificaciones');
    // Si la tabla ya nació con el modelo nuevo (sequelize.sync), no hay nada que migrar
    if (columnas.productoId) return;

    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql) => queryInterface.sequelize.query(sql, { transaction });

      // 1. La unicidad vieja (solo pedidoId) tiene un nombre que genera Postgres: se busca
      const [viejas] = await queryInterface.sequelize.query(
        `SELECT conname FROM pg_constraint
          WHERE conrelid = '"Calificaciones"'::regclass AND contype = 'u'`,
        { transaction }
      );
      for (const { conname } of viejas) {
        await q(`ALTER TABLE "Calificaciones" DROP CONSTRAINT "${conname}"`);
      }

      // 2. Columna nueva y puntaje opcional
      await queryInterface.addColumn('Calificaciones', 'productoId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }, { transaction });
      await q('ALTER TABLE "Calificaciones" ALTER COLUMN puntaje DROP NOT NULL');

      // 3. Se reparten las calificaciones viejas entre los productos calificables de su pedido
      await q(`
        INSERT INTO "Calificaciones" ("pedidoId", "usuarioId", "sucursalId", puntaje, comentario, "productoId", "createdAt", "updatedAt")
        SELECT c."pedidoId", c."usuarioId", c."sucursalId", c.puntaje,
               CASE WHEN x.posicion = 1 THEN c.comentario END,
               x."productoId", c."createdAt", c."updatedAt"
          FROM "Calificaciones" c
          JOIN (
            SELECT q."pedidoId", q."productoId",
                   ROW_NUMBER() OVER (PARTITION BY q."pedidoId" ORDER BY MIN(q.id)) AS posicion
              FROM (
                SELECT d.id, d."pedidoId", d."productoId"
                  FROM "DetallePedidos" d
                  JOIN "Productos" p ON p.id = d."productoId"
                  LEFT JOIN "Categoria" cat ON cat.id = p."categoriaId"
                 WHERE NOT (COALESCE(cat."esComplemento", false) AND d.precio = 0)
              ) q
             GROUP BY q."pedidoId", q."productoId"
          ) x ON x."pedidoId" = c."pedidoId"
         WHERE c."productoId" IS NULL
      `);
      await q('DELETE FROM "Calificaciones" WHERE "productoId" IS NULL');

      // 4. Reglas nuevas
      await q('ALTER TABLE "Calificaciones" ALTER COLUMN "productoId" SET NOT NULL');
      await queryInterface.addConstraint('Calificaciones', {
        fields: ['pedidoId', 'productoId'],
        type: 'unique',
        name: 'calificaciones_pedido_producto_unico',
        transaction,
      });
      await q(`
        ALTER TABLE "Calificaciones"
          ADD CONSTRAINT calificacion_con_puntaje_o_comentario CHECK (puntaje IS NOT NULL OR comentario IS NOT NULL)
      `);
      await queryInterface.addIndex('Calificaciones', ['productoId'], { transaction });
    });
  },

  // Vuelve a una calificación por pedido: se conserva la primera con estrellas de cada pedido (lo demás se pierde)
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql) => queryInterface.sequelize.query(sql, { transaction });

      await queryInterface.removeConstraint('Calificaciones', 'calificacion_con_puntaje_o_comentario', { transaction });
      await queryInterface.removeConstraint('Calificaciones', 'calificaciones_pedido_producto_unico', { transaction });
      await q(`
        DELETE FROM "Calificaciones" c
         WHERE c.puntaje IS NULL
            OR c.id <> (SELECT MIN(k.id) FROM "Calificaciones" k WHERE k."pedidoId" = c."pedidoId" AND k.puntaje IS NOT NULL)
      `);
      await queryInterface.removeColumn('Calificaciones', 'productoId', { transaction });
      await q('ALTER TABLE "Calificaciones" ALTER COLUMN puntaje SET NOT NULL');
      await queryInterface.addConstraint('Calificaciones', {
        fields: ['pedidoId'],
        type: 'unique',
        name: 'Calificaciones_pedidoId_key',
        transaction,
      });
    });
  },
};
