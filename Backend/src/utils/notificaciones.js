const { Notificacion } = require('../models');

const recortar = (texto, max) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto);

// Crea el mismo aviso para varios administradores (sin repetir ni contar a los que no existen).
// Devuelve a cuántos avisó. Lo usan los partes y, más adelante, el cierre de sucursal.
async function notificar(destinatarioIds, { tipo, titulo, mensaje, parteId = null }, transaction) {
    const unicos = [...new Set(destinatarioIds)].filter(Boolean);
    if (unicos.length === 0) return 0;
    await Notificacion.bulkCreate(
        unicos.map((destinatarioId) => ({ destinatarioId, tipo, titulo, mensaje, parteId })),
        { transaction },
    );
    return unicos.length;
}

module.exports = { notificar, recortar };
