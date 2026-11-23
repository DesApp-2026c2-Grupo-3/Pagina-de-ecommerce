'use strict';

const notificacionRepository = require('./notificacionRepository');
const { NotificacionService } = require('./notificacionService');
const { SocketChannel } = require('./canales/socketChannel');
const registro = require('./registroEstrategias');
const { crearFabricaNotificaciones } = require('./fabricaNotificaciones');

const canalSocket = new SocketChannel();
const notificacionService = new NotificacionService({
    repository: notificacionRepository,
    canales: [canalSocket],
});
const fabrica = crearFabricaNotificaciones({ notificacionService, registro });

module.exports = {
    notificacionRepository,
    notificacionService,
    canalSocket,
    registro,
    fabrica,
};
