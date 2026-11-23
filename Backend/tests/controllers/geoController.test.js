function cargarGeo({ conKey = true } = {}) {
    if (conKey) {
        process.env.GOOGLE_MAPS_API_KEY = 'test-key';
    } else {
        delete process.env.GOOGLE_MAPS_API_KEY;
    }
    let geo;
    jest.isolateModules(() => {
        geo = require('../../src/controllers/geoController');
    });
    return geo;
}

const {
    autocompletar,
    detalleLugar,
    direccionDesdeCoordenadas,
} = cargarGeo();

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn();
});

afterAll(() => {
    delete global.fetch;
});

describe('autocompletar', () => {
    test('devuelve una lista vacía si la búsqueda es corta', async () => {
        const res = crearRes();

        await autocompletar({ query: { q: 'ab' } }, res);

        expect(res.json).toHaveBeenCalledWith([]);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('mapea las sugerencias e incluye el sessionToken válido', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                suggestions: [
                    {
                        placePrediction: {
                            placeId: 'p1',
                            structuredFormat: {
                                mainText: { text: 'Florida 29' },
                                secondaryText: { text: 'Morón, Buenos Aires' },
                            },
                        },
                    },
                    { placePrediction: { placeId: 'p2', text: { text: 'Florida 30' } } },
                    { placePrediction: { placeId: 'p3' } },
                    { queryPrediction: {} },
                ],
            }),
        });
        const res = crearRes();

        await autocompletar({ query: { q: '  Florida 29 ', sessionToken: 'abc-123' } }, res);

        const [url, opciones] = global.fetch.mock.calls[0];
        expect(url).toBe('https://places.googleapis.com/v1/places:autocomplete');
        expect(JSON.parse(opciones.body)).toMatchObject({
            input: 'Florida 29',
            sessionToken: 'abc-123',
        });
        expect(res.json).toHaveBeenCalledWith([
            { placeId: 'p1', principal: 'Florida 29', secundario: 'Morón, Buenos Aires' },
            { placeId: 'p2', principal: 'Florida 30', secundario: '' },
            { placeId: 'p3', principal: '', secundario: '' },
        ]);
    });

    test('descarta un sessionToken inválido', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

        await autocompletar({ query: { q: 'Florida', sessionToken: 'token con espacios' } }, crearRes());

        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(body.sessionToken).toBeUndefined();
    });

    test('responde 502 si Google devuelve un error', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => 'error interno',
        });
        const res = crearRes();

        await autocompletar({ query: { q: 'Florida' } }, res);

        expect(res.status).toHaveBeenCalledWith(502);
    });

    test('responde 502 si fetch falla', async () => {
        global.fetch.mockRejectedValue(new Error('sin red'));
        const res = crearRes();

        await autocompletar({ query: { q: 'Florida' } }, res);

        expect(res.status).toHaveBeenCalledWith(502);
    });

    test('responde 429 al superar el límite diario', async () => {
        const geo = cargarGeo();
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({ suggestions: [] }) });

        for (let i = 0; i < 300; i += 1) {
            await geo.autocompletar({ query: { q: 'Florida' } }, crearRes());
        }
        const res = crearRes();
        await geo.autocompletar({ query: { q: 'Florida' } }, res);

        expect(res.status).toHaveBeenCalledWith(429);
    });

    test('responde 500 si falta la API key', async () => {
        const geo = cargarGeo({ conKey: false });
        const res = crearRes();

        await geo.autocompletar({ query: { q: 'Florida' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(global.fetch).not.toHaveBeenCalled();
    });
});

describe('detalleLugar', () => {
    test('rechaza un placeId inválido', async () => {
        const res = crearRes();

        await detalleLugar({ params: { placeId: 'no valido!' }, query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Lugar inválido' });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('mapea todos los componentes de la dirección', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                formattedAddress: 'Florida 29, Morón',
                addressComponents: [
                    { longText: 'Florida', types: ['route'] },
                    { longText: '29', types: ['street_number'] },
                    { longText: 'Morón', types: ['sublocality'] },
                    { longText: 'Morón', types: ['administrative_area_level_2'] },
                    { longText: 'Buenos Aires', types: ['administrative_area_level_1'] },
                    { longText: '1708', types: ['postal_code'] },
                ],
                location: { latitude: -34.65, longitude: -58.62 },
            }),
        });
        const res = crearRes();

        await detalleLugar({ params: { placeId: 'ChIJ_abc-123' }, query: { sessionToken: 'tok-1' } }, res);

        const [url] = global.fetch.mock.calls[0];
        expect(url).toContain('/places/ChIJ_abc-123');
        expect(url).toContain('sessionToken=tok-1');
        expect(res.json).toHaveBeenCalledWith({
            direccionCompleta: 'Florida 29, Morón',
            calle: 'Florida',
            altura: 29,
            localidad: 'Morón',
            departamento: 'Morón',
            provincia: 'Buenos Aires',
            codigoPostal: '1708',
            latitud: -34.65,
            longitud: -58.62,
        });
    });

    test('tolera una respuesta sin componentes ni ubicación', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
        const res = crearRes();

        await detalleLugar({ params: { placeId: 'abc' }, query: {} }, res);

        expect(res.json).toHaveBeenCalledWith({
            direccionCompleta: '',
            calle: null,
            altura: null,
            localidad: null,
            departamento: null,
            provincia: null,
            codigoPostal: null,
            latitud: null,
            longitud: null,
        });
    });

    test('usa administrative_area_level_2 como localidad si falta locality y sublocality', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                addressComponents: [
                    { longText: 'Morón', types: ['administrative_area_level_2'] },
                ],
            }),
        });
        const res = crearRes();

        await detalleLugar({ params: { placeId: 'abc' }, query: {} }, res);

        expect(res.json.mock.calls[0][0].localidad).toBe('Morón');
    });

    test('responde 502 si Google devuelve un error', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 400,
            text: async () => 'bad request',
        });
        const res = crearRes();

        await detalleLugar({ params: { placeId: 'abc' }, query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(502);
    });

    test('responde 502 si fetch falla', async () => {
        global.fetch.mockRejectedValue(new Error('sin red'));
        const res = crearRes();

        await detalleLugar({ params: { placeId: 'abc' }, query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(502);
    });

    test('responde 500 si falta la API key', async () => {
        const geo = cargarGeo({ conKey: false });
        const res = crearRes();

        await geo.detalleLugar({ params: { placeId: 'abc' }, query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('direccionDesdeCoordenadas', () => {
    test('rechaza coordenadas inválidas', async () => {
        const res = crearRes();

        await direccionDesdeCoordenadas({ query: { lat: '200', lon: '-58' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rechaza coordenadas no numéricas', async () => {
        const res = crearRes();

        await direccionDesdeCoordenadas({ query: { lat: 'abc', lon: 'def' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('responde 404 cuando no hay resultados', async () => {
        global.fetch.mockResolvedValue({ json: async () => ({ status: 'ZERO_RESULTS' }) });
        const res = crearRes();

        await direccionDesdeCoordenadas({ query: { lat: '-34.6', lon: '-58.4' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('mapea la dirección y tolera componentes opcionales', async () => {
        global.fetch.mockResolvedValue({
            json: async () => ({
                status: 'OK',
                results: [{
                    address_components: [
                        { long_name: 'Rivadavia', types: ['route'] },
                        { long_name: '1234', types: ['street_number'] },
                        { long_name: 'Morón', types: ['administrative_area_level_2'] },
                    ],
                    geometry: { location: { lat: -34.6, lng: -58.4 } },
                }],
            }),
        });
        const res = crearRes();

        await direccionDesdeCoordenadas({ query: { lat: '-34.6', lon: '-58.4' } }, res);

        expect(res.json).toHaveBeenCalledWith({
            direccionCompleta: '',
            calle: 'Rivadavia',
            altura: 1234,
            localidad: 'Morón',
            departamento: 'Morón',
            provincia: null,
            codigoPostal: null,
            latitud: -34.6,
            longitud: -58.4,
        });
    });

    test('usa locality para la localidad cuando existe', async () => {
        global.fetch.mockResolvedValue({
            json: async () => ({
                status: 'OK',
                results: [{
                    formatted_address: 'Rivadavia 1234, Morón',
                    address_components: [
                        { long_name: 'Morón', types: ['locality'] },
                    ],
                }],
            }),
        });
        const res = crearRes();

        await direccionDesdeCoordenadas({ query: { lat: '-34.6', lon: '-58.4' } }, res);

        expect(res.json.mock.calls[0][0].localidad).toBe('Morón');
        expect(res.json.mock.calls[0][0].direccionCompleta).toBe('Rivadavia 1234, Morón');
    });

    test('responde 502 si Geocoding devuelve un estado distinto de OK', async () => {
        global.fetch.mockResolvedValue({
            json: async () => ({ status: 'REQUEST_DENIED', error_message: 'key inválida' }),
        });
        const res = crearRes();

        await direccionDesdeCoordenadas({ query: { lat: '-34.6', lon: '-58.4' } }, res);

        expect(res.status).toHaveBeenCalledWith(502);
    });

    test('responde 502 si fetch falla', async () => {
        global.fetch.mockRejectedValue(new Error('sin red'));
        const res = crearRes();

        await direccionDesdeCoordenadas({ query: { lat: '-34.6', lon: '-58.4' } }, res);

        expect(res.status).toHaveBeenCalledWith(502);
    });

    test('responde 500 si falta la API key', async () => {
        const geo = cargarGeo({ conKey: false });
        const res = crearRes();

        await geo.direccionDesdeCoordenadas({ query: { lat: '-34.6', lon: '-58.4' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
