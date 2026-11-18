'use strict';

const { crearControladorBandeja } = require('./bandejaNotificaciones');

// Bandeja de la tienda (clientes)
module.exports = crearControladorBandeja({ destinatarioTipo: 'cliente', audiencia: 'cliente' });
