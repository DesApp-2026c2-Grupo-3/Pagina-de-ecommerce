'use strict';

const { crearControladorBandeja } = require('../bandejaNotificaciones');

// Bandeja de la app del repartidor
module.exports = crearControladorBandeja({ destinatarioTipo: 'repartidor', audiencia: 'repartidor' });
