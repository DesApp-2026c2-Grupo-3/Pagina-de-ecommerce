'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const id = {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      };
      const timestamps = {
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      };

      await queryInterface.createTable('notificaciones', {
        id,
        tipo: { type: Sequelize.STRING, allowNull: false },
        version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        datos: { type: Sequelize.JSONB, allowNull: false },
        destinos: { type: Sequelize.JSONB, allowNull: false },
        ocurrido_en: { type: Sequelize.DATE, allowNull: false },
        ...timestamps,
      }, { transaction });

      await queryInterface.createTable('notificacion_destinatarios', {
        id,
        notificacion_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: { model: 'notificaciones', key: 'id' },
          onDelete: 'CASCADE',
        },
        destinatario_tipo: { type: Sequelize.STRING(10), allowNull: false },
        destinatario_id: { type: Sequelize.INTEGER, allowNull: false },
        leida: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        leida_en: { type: Sequelize.DATE, allowNull: true },
        ...timestamps,
      }, { transaction });

      await queryInterface.addConstraint('notificacion_destinatarios', {
        fields: ['notificacion_id', 'destinatario_tipo', 'destinatario_id'],
        type: 'unique',
        name: 'notificacion_destinatario_unico',
        transaction,
      });

      await queryInterface.addIndex(
        'notificacion_destinatarios',
        ['destinatario_tipo', 'destinatario_id', 'leida'],
        {
          name: 'notificacion_destinatarios_bandeja_idx',
          transaction,
        }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('notificacion_destinatarios', { transaction });
      await queryInterface.dropTable('notificaciones', { transaction });
    });
  },
};
