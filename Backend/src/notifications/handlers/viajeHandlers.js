'use strict';

// Fachada del dominio de viajes (D-10). Los controladores la llaman DESPUÉS del commit:
// arma los avisos al cliente, al panel admin y a los repartidores (secciones 7.4 y 7.7 del plan).
// Nunca lanza: un aviso que falla se registra y no revierte ni cambia la respuesta HTTP.

const { fabrica } = require('../index');
const { notificarEstadoPedido } = require('./pedidoHandlers');
const { emitirRefrescoAdmin } = require('../adminRefresco');
const { emitirRefrescoRepartidor } = require('../repartidorRefresco');

async function avisar(descripcion, tareas) {
    // async: un error sincrónico de una tarea también termina como promesa rechazada
    const resultados = await Promise.allSettled(tareas.map(async (tarea) => tarea()));

    resultados
        .filter((resultado) => resultado.status === 'rejected')
        .forEach((resultado) => {
            console.error(`No se pudo avisar ${descripcion}:`, resultado.reason?.message ?? resultado.reason);
        });
}

const refrescoAdmin = (dominio, sucursalId, recursos) => () => emitirRefrescoAdmin({
    dominio,
    accion: 'estado_cambiado',
    sucursalId,
    recursos,
});

// Un repartidor tomó pedidos: dejan de estar disponibles para los demás
function notificarPedidosTomados({ viajeId, sucursalId }) {
    return avisar('la toma de pedidos', [
        () => emitirRefrescoRepartidor({ dominio: 'pedidos_disponibles', accion: 'eliminado', sucursalId }),
        refrescoAdmin('pedidos', sucursalId),
        refrescoAdmin('viajes', sucursalId, { viajeId }),
    ]);
}

// Retiró un pedido en el local: el cliente no se entera (para él sigue "En proceso")
function notificarPedidoRetirado({ pedido }) {
    return avisar(`el retiro del pedido ${pedido.id}`, [
        refrescoAdmin('pedidos', pedido.sucursalId, { pedidoId: pedido.id }),
        refrescoAdmin('viajes', pedido.sucursalId, { viajeId: pedido.viajeId }),
    ]);
}

// Quitó un pedido de su viaje: vuelve a estar disponible para todos. El refresco dice quién
// lo quitó (D-21): a sus compañeros les aparece el aviso; a él solo se le actualiza la lista.
function notificarPedidoQuitado({ pedido, viajeId, repartidorId }) {
    return avisar(`que se quitó el pedido ${pedido.id}`, [
        () => emitirRefrescoRepartidor({
            dominio: 'pedidos_disponibles',
            accion: 'creado',
            sucursalId: pedido.sucursalId,
            origenRepartidorId: repartidorId,
            recursos: { pedidoId: pedido.id },
        }),
        refrescoAdmin('viajes', pedido.sucursalId, { viajeId }),
    ]);
}

// Inició el viaje: cada cliente recibe "En camino". El estado anterior que ve el
// cliente es "En proceso" (pedidoHandlers traduce "Listo para retirar").
function notificarViajeIniciado({ viaje, pedidos, sucursalId }) {
    return avisar(`la salida del viaje ${viaje.id}`, [
        ...pedidos.map((pedido) => () => notificarEstadoPedido(pedido, 'Listo para retirar')),
        refrescoAdmin('pedidos', sucursalId),
        refrescoAdmin('viajes', sucursalId, { viajeId: viaje.id }),
    ]);
}

// Entregó un pedido: el cliente recibe "Entregado"
function notificarPedidoEntregado({ pedido, estadoAnterior }) {
    return avisar(`la entrega del pedido ${pedido.id}`, [
        () => notificarEstadoPedido(pedido, estadoAnterior),
        refrescoAdmin('pedidos', pedido.sucursalId, { pedidoId: pedido.id }),
        refrescoAdmin('viajes', pedido.sucursalId, { viajeId: pedido.viajeId }),
    ]);
}

// Pidió asistencia: notificación persistida para los admins de su sucursal y el MASTER
function notificarAsistenciaSolicitada({ viaje, repartidor }) {
    return avisar(`la asistencia del viaje ${viaje.id}`, [
        () => fabrica.publicarPorTipo('viaje.requiere_asistencia', {
            viajeId: viaje.id,
            repartidorId: repartidor.id,
            repartidorNombre: repartidor.nombre,
            sucursalId: repartidor.sucursalId,
            motivo: viaje.motivoAsistencia,
            comentario: viaje.comentarioAsistencia,
            solicitadaEn: viaje.fechaSolicitudAsistencia,
        }),
        refrescoAdmin('viajes', repartidor.sucursalId, { viajeId: viaje.id }),
    ]);
}

// D-19: el repartidor que va a asistir confirmó que recibió el viaje reasignado.
// Avisa a los admins de la sucursal y al MASTER, y refresca el panel de viajes.
function notificarRecepcionConfirmada({ viaje, repartidor, cantidadPedidos }) {
    return avisar(`la recepción del viaje ${viaje.id}`, [
        () => fabrica.publicarPorTipo('viaje.asistencia_tomada', {
            viajeId: viaje.id,
            repartidorId: repartidor.id,
            repartidorNombre: repartidor.nombre,
            sucursalId: repartidor.sucursalId,
            cantidadPedidos,
            tomadaEn: new Date().toISOString(),
        }),
        refrescoAdmin('viajes', repartidor.sucursalId, { viajeId: viaje.id }),
    ]);
}

// El admin reasignó un viaje: el nuevo lo recibe y el anterior lo pierde
function notificarViajeReasignado({ viaje, anteriorId, nuevoId, sucursalId, cantidadPedidos }) {
    const refrescoViaje = (repartidorId) => () => emitirRefrescoRepartidor({
        dominio: 'viaje',
        accion: 'actualizado',
        sucursalId,
        repartidorId,
        recursos: { viajeId: viaje.id },
    });

    return avisar(`la reasignación del viaje ${viaje.id}`, [
        () => fabrica.publicarPorTipo('viaje.asignado', {
            viajeId: viaje.id,
            repartidorId: nuevoId,
            cantidadPedidos,
        }),
        () => fabrica.publicarPorTipo('viaje.reasignado', {
            viajeId: viaje.id,
            repartidorId: anteriorId,
        }),
        refrescoViaje(nuevoId),
        refrescoViaje(anteriorId),
        refrescoAdmin('viajes', sucursalId, { viajeId: viaje.id }),
    ]);
}

// D-08: el admin canceló un pedido que estaba en un viaje en preparación
function notificarPedidoCanceladoEnViaje({ pedido, viaje, viajeEliminado }) {
    return avisar(`la cancelación del pedido ${pedido.id} en su viaje`, [
        () => fabrica.publicarPorTipo('pedido.cancelado_en_viaje', {
            pedidoId: pedido.id,
            viajeId: viaje.id,
            repartidorId: viaje.repartidorId,
            viajeEliminado,
        }),
        () => emitirRefrescoRepartidor({
            dominio: 'viaje',
            accion: 'actualizado',
            sucursalId: pedido.sucursalId,
            repartidorId: viaje.repartidorId,
            recursos: { pedidoId: pedido.id, viajeId: viaje.id },
        }),
        refrescoAdmin('viajes', pedido.sucursalId, { viajeId: viaje.id }),
    ]);
}

// Cambió la lista de pedidos disponibles por una acción del admin
// (un pedido pasó a "Listo para retirar" o se canceló uno que estaba disponible)
function notificarDisponibilidad({ pedido, accion }) {
    return avisar(`la disponibilidad del pedido ${pedido.id}`, [
        () => emitirRefrescoRepartidor({
            dominio: 'pedidos_disponibles',
            accion,
            sucursalId: pedido.sucursalId,
            recursos: { pedidoId: pedido.id },
        }),
    ]);
}

module.exports = {
    notificarPedidosTomados,
    notificarPedidoRetirado,
    notificarPedidoQuitado,
    notificarViajeIniciado,
    notificarPedidoEntregado,
    notificarAsistenciaSolicitada,
    notificarRecepcionConfirmada,
    notificarViajeReasignado,
    notificarPedidoCanceladoEnViaje,
    notificarDisponibilidad,
};
