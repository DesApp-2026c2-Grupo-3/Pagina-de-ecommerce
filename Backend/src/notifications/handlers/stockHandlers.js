'use strict';

const { fabrica } = require('../index');

function notificarStockBajo(payload) {
    return fabrica.publicarPorTipo('stock.bajo', payload);
}

module.exports = { notificarStockBajo };
