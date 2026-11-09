'use strict';

const notificacionRepository = require('./notificacionRepository');
const { NotificacionService } = require('./notificacionService');
const { SocketChannel } = require('./canales/socketChannel');

const canalSocket = new SocketChannel();
const notificacionService = new NotificacionService({
    repository: notificacionRepository,
    canales: [canalSocket],
});

module.exports = { notificacionRepository, notificacionService, canalSocket };
