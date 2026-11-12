'use strict';

function codificarCursor(valor) {
    if (!valor) return null;

    const ocurridoEn = new Date(valor.ocurridoEn);
    const id = Number(valor.id);

    if (Number.isNaN(ocurridoEn.getTime()) || !Number.isInteger(id) || id <= 0) {
        return null;
    }

    return Buffer.from(JSON.stringify({
        ocurridoEn: ocurridoEn.toISOString(),
        id,
    })).toString('base64url');
}

function decodificarCursor(cursor) {
    if (!cursor) return null;

    try {
        const datos = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf8'));
        const ocurridoEn = new Date(datos.ocurridoEn);
        const id = Number(datos.id);

        if (Number.isNaN(ocurridoEn.getTime()) || !Number.isInteger(id) || id <= 0) {
            return null;
        }

        return { ocurridoEn, id };
    } catch {
        return null;
    }
}

module.exports = { codificarCursor, decodificarCursor };
