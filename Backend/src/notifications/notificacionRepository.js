'use strict';

const { Op } = require('sequelize');
const {
  sequelize,
  Notificacion,
  NotificacionDestinatario,
  Admin,
  Usuario,
} = require('../models');
const { codificarCursor, decodificarCursor } = require('./cursor');
const { TIPOS } = require('./events');

const DESTINATARIO_CLIENTE = 'cliente';
const DESTINATARIO_ADMIN = 'admin';
const LIMITE_POR_DEFECTO = 50;
const TIPOS_SIN_ADMIN = new Set([TIPOS.PEDIDO_ESTADO_CAMBIADO]);

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

function destinosSinAdministradores(tipo, destinos = {}) {
  if (!TIPOS_SIN_ADMIN.has(tipo) || typeof destinos !== 'object' || destinos === null) {
    return destinos;
  }

  const limpios = { ...destinos };
  delete limpios.administradores;
  delete limpios.administradoresSucursal;

  if (Array.isArray(limpios.roles)) {
    const roles = limpios.roles.filter((rol) => rol !== 'admin');
    if (roles.length > 0) {
      limpios.roles = roles;
    } else {
      delete limpios.roles;
    }
  }

  return limpios;
}

function filtroTipos(opciones = {}) {
  if (Array.isArray(opciones.tipos)) {
    const tipos = [...new Set(opciones.tipos.filter((tipo) => typeof tipo === 'string'))];
    return { [Op.in]: tipos };
  }

  if (Array.isArray(opciones.excluirTipos)) {
    const tipos = [...new Set(opciones.excluirTipos.filter((tipo) => typeof tipo === 'string'))];
    return { [Op.notIn]: tipos };
  }

  return null;
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
  const destinosPersistidos = destinosSinAdministradores(tipo, destinos);

  return sequelize.transaction(async (transaction) => {
    const notificacion = await Notificacion.create({
      tipo,
      datos,
      destinos: destinosPersistidos,
      version,
      ocurridoEn,
    }, { transaction });

    const destinatarios = await resolverDestinatarios(destinosPersistidos, transaction);

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

  const include = {
    model: Notificacion,
    as: 'notificacion',
    required: true,
  };
  const tipos = filtroTipos(opciones);
  if (tipos) include.where = { tipo: tipos };

  const filas = await NotificacionDestinatario.findAll({
    where,
    include: [include],
    order: [
      [{ model: Notificacion, as: 'notificacion' }, 'ocurridoEn', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
    offset,
  });

  return filas.map((fila) => aNotificacionDto(fila.notificacion, fila));
}

async function listarPagina(opciones = {}) {
  const { destinatarioTipo, destinatarioId } = normalizarDestinatario(opciones);
  const where = { destinatarioTipo, destinatarioId };

  if (typeof opciones.leida === 'boolean') {
    where.leida = opciones.leida;
  }

  const { limit } = normalizarPaginacion(opciones.limite ?? opciones.limit, 0);
  const tamanoPagina = Math.min(limit, 100);
  const cursor = opciones.cursor ? decodificarCursor(opciones.cursor) : null;

  if (opciones.cursor && !cursor) {
    const error = new Error('CURSOR_INVALIDO');
    error.code = 'CURSOR_INVALIDO';
    throw error;
  }

  const include = {
    model: Notificacion,
    as: 'notificacion',
    required: true,
  };
  const tipos = filtroTipos(opciones);
  const cursorWhere = cursor
    ? {
      [Op.or]: [
        { ocurridoEn: { [Op.lt]: cursor.ocurridoEn } },
        {
          ocurridoEn: cursor.ocurridoEn,
          id: { [Op.lt]: cursor.id },
        },
      ],
    }
    : null;

  if (tipos && cursorWhere) {
    include.where = {
      [Op.and]: [
        { tipo: tipos },
        cursorWhere,
      ],
    };
  } else if (tipos) {
    include.where = { tipo: tipos };
  } else if (cursorWhere) {
    include.where = cursorWhere;
  }

  const filas = await NotificacionDestinatario.findAll({
    where,
    include: [include],
    order: [
      [{ model: Notificacion, as: 'notificacion' }, 'ocurridoEn', 'DESC'],
      [{ model: Notificacion, as: 'notificacion' }, 'id', 'DESC'],
    ],
    limit: tamanoPagina + 1,
  });

  const hayMas = filas.length > tamanoPagina;
  const filasPagina = filas.slice(0, tamanoPagina);
  const ultima = filasPagina[filasPagina.length - 1];

  return {
    items: filasPagina.map((fila) => aNotificacionDto(fila.notificacion, fila)),
    siguienteCursor: hayMas && ultima
      ? codificarCursor({
        ocurridoEn: ultima.notificacion.ocurridoEn,
        id: ultima.notificacion.id,
      })
      : null,
  };
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

  const leidaEn = opciones.leidaEn instanceof Date ? opciones.leidaEn : new Date();

  const [cantidad] = await NotificacionDestinatario.update({
    leida: true,
    leidaEn,
  }, { where });

  return cantidad;
}

async function contarNoLeidas(opciones = {}) {
  const { destinatarioTipo, destinatarioId } = normalizarDestinatario(opciones);
  const tipos = filtroTipos(opciones);
  const consulta = {
    where: {
      destinatarioTipo,
      destinatarioId,
      leida: false,
    },
  };

  if (tipos) {
    consulta.include = [{
      model: Notificacion,
      as: 'notificacion',
      required: true,
      where: { tipo: tipos },
    }];
  }

  return NotificacionDestinatario.count(consulta);
}

module.exports = {
  guardar,
  listar,
  listarPagina,
  marcarLeidas,
  contarNoLeidas,
};
