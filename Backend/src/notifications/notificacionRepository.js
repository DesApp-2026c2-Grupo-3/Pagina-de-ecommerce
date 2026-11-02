'use strict';

const { Op } = require('sequelize');
const {
  sequelize,
  Notificacion,
  NotificacionDestinatario,
  Admin,
  Usuario,
} = require('../models');

const DESTINATARIO_CLIENTE = 'cliente';
const DESTINATARIO_ADMIN = 'admin';
const LIMITE_POR_DEFECTO = 50;

function idsUnicos(valor) {
  if (!Array.isArray(valor)) return [];

  return [...new Set(
    valor
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  )];
}

function normalizarDestinatario({ destinatarioTipo, destinatarioId, tipo, id } = {}) {
  return {
    destinatarioTipo: destinatarioTipo ?? tipo,
    destinatarioId: Number(destinatarioId ?? id),
  };
}

function normalizarPaginacion(limite, offset) {
  const limiteNormalizado = Number(limite);
  const offsetNormalizado = Number(offset);

  return {
    limit: Number.isInteger(limiteNormalizado) && limiteNormalizado > 0
      ? limiteNormalizado
      : LIMITE_POR_DEFECTO,
    offset: Number.isInteger(offsetNormalizado) && offsetNormalizado >= 0
      ? offsetNormalizado
      : 0,
  };
}

function aNotificacionDto(notificacion, destinatario = null) {
  const dto = {
    id: Number(notificacion.id),
    tipo: notificacion.tipo,
    version: Number(notificacion.version),
    ocurridoEn: new Date(notificacion.ocurridoEn).toISOString(),
    datos: notificacion.datos,
    destinos: notificacion.destinos,
  };

  if (destinatario) {
    dto.leida = Boolean(destinatario.leida);
    dto.leidaEn = destinatario.leidaEn
      ? new Date(destinatario.leidaEn).toISOString()
      : null;
  }

  return dto;
}

async function resolverDestinatarios(destinos = {}, transaction) {
  const destinatarios = new Map();

  const agregar = (destinatarioTipo, destinatarioId) => {
    const id = Number(destinatarioId);
    if (!Number.isInteger(id) || id <= 0) return;

    destinatarios.set(`${destinatarioTipo}:${id}`, {
      destinatarioTipo,
      destinatarioId: id,
    });
  };

  idsUnicos(destinos.clientes).forEach((id) => agregar(DESTINATARIO_CLIENTE, id));
  idsUnicos(destinos.administradores).forEach((id) => agregar(DESTINATARIO_ADMIN, id));

  const sucursalesAdmin = idsUnicos(destinos.administradoresSucursal);
  if (sucursalesAdmin.length > 0) {
    const admins = await Admin.findAll({
      where: {
        sucursalId: { [Op.in]: sucursalesAdmin },
        activo: true,
      },
      attributes: ['id'],
      transaction,
    });

    admins.forEach((admin) => agregar(DESTINATARIO_ADMIN, admin.id));
  }

  const sucursalesCliente = idsUnicos(destinos.clientesSucursal);
  if (sucursalesCliente.length > 0) {
    const clientes = await Usuario.findAll({
      where: {
        sucursalId: { [Op.in]: sucursalesCliente },
      },
      attributes: ['id'],
      transaction,
    });

    clientes.forEach((cliente) => agregar(DESTINATARIO_CLIENTE, cliente.id));
  }

  return [...destinatarios.values()];
}

async function guardar({ tipo, datos, destinos = {}, version = 1, ocurridoEn = new Date() } = {}) {
  return sequelize.transaction(async (transaction) => {
    const notificacion = await Notificacion.create({
      tipo,
      datos,
      destinos,
      version,
      ocurridoEn,
    }, { transaction });

    const destinatarios = await resolverDestinatarios(destinos, transaction);

    if (destinatarios.length > 0) {
      await NotificacionDestinatario.bulkCreate(
        destinatarios.map((destinatario) => ({
          ...destinatario,
          notificacionId: notificacion.id,
        })),
        { transaction }
      );
    }

    return aNotificacionDto(notificacion);
  });
}

async function listar(opciones = {}) {
  const { destinatarioTipo, destinatarioId } = normalizarDestinatario(opciones);
  const where = { destinatarioTipo, destinatarioId };

  if (typeof opciones.leida === 'boolean') {
    where.leida = opciones.leida;
  }

  const { limit, offset } = normalizarPaginacion(
    opciones.limite ?? opciones.limit,
    opciones.offset
  );

  const filas = await NotificacionDestinatario.findAll({
    where,
    include: [{
      model: Notificacion,
      as: 'notificacion',
      required: true,
    }],
    order: [
      [{ model: Notificacion, as: 'notificacion' }, 'ocurridoEn', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
    offset,
  });

  return filas.map((fila) => aNotificacionDto(fila.notificacion, fila));
}

async function marcarLeidas(opciones = {}) {
  const { destinatarioTipo, destinatarioId } = normalizarDestinatario(opciones);
  const where = {
    destinatarioTipo,
    destinatarioId,
    leida: false,
  };

  const ids = opciones.notificacionIds !== undefined
    ? (Array.isArray(opciones.notificacionIds) ? opciones.notificacionIds : [opciones.notificacionIds])
    : (opciones.notificacionId !== undefined ? [opciones.notificacionId] : null);

  if (ids !== null) {
    const notificacionIds = idsUnicos(ids);
    if (notificacionIds.length === 0) return 0;

    where.notificacionId = { [Op.in]: notificacionIds };
  }

  const [cantidad] = await NotificacionDestinatario.update({
    leida: true,
    leidaEn: new Date(),
  }, { where });

  return cantidad;
}

async function contarNoLeidas(opciones = {}) {
  const { destinatarioTipo, destinatarioId } = normalizarDestinatario(opciones);

  return NotificacionDestinatario.count({
    where: {
      destinatarioTipo,
      destinatarioId,
      leida: false,
    },
  });
}

module.exports = {
  guardar,
  listar,
  marcarLeidas,
  contarNoLeidas,
};
