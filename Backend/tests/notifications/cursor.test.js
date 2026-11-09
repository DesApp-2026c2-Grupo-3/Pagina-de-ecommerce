'use strict';

const { codificarCursor, decodificarCursor } = require('../../src/notifications/cursor');

test('codifica y decodifica un cursor', () => {
    const cursor = codificarCursor({
        ocurridoEn: '2026-11-02T15:00:00.000Z',
        id: 45,
    });

    expect(typeof cursor).toBe('string');
    expect(decodificarCursor(cursor)).toEqual({
        ocurridoEn: new Date('2026-11-02T15:00:00.000Z'),
        id: 45,
    });
});

test.each([
    undefined,
    null,
    '',
    'no-es-base64',
    Buffer.from('{"id":0}').toString('base64url'),
    Buffer.from('{"ocurridoEn":"fecha-invalida","id":1}').toString('base64url'),
])('rechaza el cursor inválido %p', (cursor) => {
    expect(decodificarCursor(cursor)).toBeNull();
});

test('no genera cursor con datos inválidos', () => {
    expect(codificarCursor(null)).toBeNull();
    expect(codificarCursor({ ocurridoEn: 'x', id: 1 })).toBeNull();
    expect(codificarCursor({ ocurridoEn: new Date(), id: 0 })).toBeNull();
});
