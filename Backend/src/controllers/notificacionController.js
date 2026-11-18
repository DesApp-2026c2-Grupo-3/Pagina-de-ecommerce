'use strict';

const { crearControladorBandeja } = require('./bandejaNotificaciones');

// Bandeja del panel de administración (ADMIN y MASTER)
module.exports = crearControladorBandeja({ destinatarioTipo: 'admin', audiencia: 'admin' });
