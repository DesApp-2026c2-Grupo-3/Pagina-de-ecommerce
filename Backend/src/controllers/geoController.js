// Búsqueda y geocodificación de direcciones con Google Maps Platform.
// - Sugerencias mientras se escribe → Places API (New) Autocomplete
// - Datos de la dirección elegida   → Places API (New) Place Details
// - Coordenadas → dirección         → Geocoding API ("Ubicación actual")
//
// La API key vive SOLO en el backend (GOOGLE_MAPS_API_KEY en el .env).
// Además de la protección de la prueba gratuita de Google, hay un
// contador diario propio: si se supera, el backend deja de consultar a Google.

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACES_URL = 'https://places.googleapis.com/v1';
const GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

if (!API_KEY) {
    console.warn('[geo] Falta GOOGLE_MAPS_API_KEY en el .env: la búsqueda de direcciones no va a funcionar.');
}

// ---------- Límite diario propio ----------
const LIMITES_DIARIOS = {
    autocompletar: 300,
    detalle: 150,
    reverse: 150,
};

function hoy() {
    return new Date().toISOString().slice(0, 10);
}

let fechaContador = hoy();
let contadores = { autocompletar: 0, detalle: 0, reverse: 0 };

function consumir(tipo) {
    const fecha = hoy();
    if (fecha !== fechaContador) {
        fechaContador = fecha;
        contadores = { autocompletar: 0, detalle: 0, reverse: 0 };
    }
    if (contadores[tipo] >= LIMITES_DIARIOS[tipo]) {
        console.warn(`[geo] Límite diario alcanzado para "${tipo}"`);
        return false;
    }
    contadores[tipo] += 1;
    return true;
}

function limiteAlcanzado(res) {
    return res.status(429).json({
        mensaje: 'Se alcanzó el límite diario de búsquedas de direcciones. Probá mañana.',
    });
}

function sinKey(res) {
    return res.status(500).json({ mensaje: 'Servicio de direcciones no configurado' });
}

// ---------- Helpers ----------
function limpiarSessionToken(valor) {
    const token = String(valor || '');
    return /^[A-Za-z0-9-]{1,36}$/.test(token) ? token : '';
}

function aNumero(valor) {
    const n = parseInt(valor, 10);
    return Number.isFinite(n) ? n : null;
}

// Places (New): addressComponents = [{ longText, shortText, types }]
function componentePlaces(componentes, tipo) {
    return componentes?.find((c) => c.types?.includes(tipo))?.longText ?? null;
}

// Geocoding: address_components = [{ long_name, short_name, types }]
function componenteGeocoding(componentes, tipo) {
    return componentes?.find((c) => c.types?.includes(tipo))?.long_name ?? null;
}

function mapPlaces(d) {
    const c = d.addressComponents;
    return {
        direccionCompleta: d.formattedAddress ?? '',
        calle: componentePlaces(c, 'route'),
        altura: aNumero(componentePlaces(c, 'street_number')),
        localidad:
            componentePlaces(c, 'locality') ??
            componentePlaces(c, 'sublocality') ??
            componentePlaces(c, 'administrative_area_level_2'),
        departamento: componentePlaces(c, 'administrative_area_level_2'),
        provincia: componentePlaces(c, 'administrative_area_level_1'),
        codigoPostal: componentePlaces(c, 'postal_code'),
        latitud: d.location?.latitude ?? null,
        longitud: d.location?.longitude ?? null,
    };
}

function mapGeocoding(r) {
    const c = r.address_components;
    return {
        direccionCompleta: r.formatted_address ?? '',
        calle: componenteGeocoding(c, 'route'),
        altura: aNumero(componenteGeocoding(c, 'street_number')),
        localidad:
            componenteGeocoding(c, 'locality') ??
            componenteGeocoding(c, 'sublocality') ??
            componenteGeocoding(c, 'administrative_area_level_2'),
        departamento: componenteGeocoding(c, 'administrative_area_level_2'),
        provincia: componenteGeocoding(c, 'administrative_area_level_1'),
        codigoPostal: componenteGeocoding(c, 'postal_code'),
        latitud: r.geometry?.location?.lat ?? null,
        longitud: r.geometry?.location?.lng ?? null,
    };
}

// GET /geo/autocompletar?q=Florida 29&sessionToken=...
const autocompletar = async (req, res) => {
    const q = String(req.query.q || '').trim();
    const sessionToken = limpiarSessionToken(req.query.sessionToken);

    if (q.length < 3) return res.json([]);
    if (!API_KEY) return sinKey(res);
    if (!consumir('autocompletar')) return limiteAlcanzado(res);

    try {
        const body = {
            input: q,
            includedRegionCodes: ['ar'],
            languageCode: 'es',
            regionCode: 'ar',
        };
        if (sessionToken) body.sessionToken = sessionToken;

        const respuesta = await fetch(`${PLACES_URL}/places:autocomplete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
            },
            body: JSON.stringify(body),
        });

        if (!respuesta.ok) {
            throw new Error(`Places Autocomplete respondió ${respuesta.status}: ${await respuesta.text()}`);
        }

        const data = await respuesta.json();
        const sugerencias = (data.suggestions || [])
            .filter((s) => s.placePrediction)
            .map(({ placePrediction: p }) => ({
                placeId: p.placeId,
                principal: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
                secundario: p.structuredFormat?.secondaryText?.text ?? '',
            }));

        res.json(sugerencias);
    } catch (error) {
        console.error(error);
        res.status(502).json({ mensaje: 'No se pudieron obtener sugerencias. Probá de nuevo.' });
    }
};

// GET /geo/detalle/:placeId?sessionToken=...
const detalleLugar = async (req, res) => {
    const placeId = String(req.params.placeId || '');
    const sessionToken = limpiarSessionToken(req.query.sessionToken);

    if (!/^[A-Za-z0-9_-]+$/.test(placeId)) {
        return res.status(400).json({ mensaje: 'Lugar inválido' });
    }
    if (!API_KEY) return sinKey(res);
    if (!consumir('detalle')) return limiteAlcanzado(res);

    try {
        const params = new URLSearchParams({ languageCode: 'es', regionCode: 'ar' });
        if (sessionToken) params.set('sessionToken', sessionToken);

        const respuesta = await fetch(`${PLACES_URL}/places/${placeId}?${params}`, {
            headers: {
                'X-Goog-Api-Key': API_KEY,
                // Solo campos de la categoría Essentials (la más barata)
                'X-Goog-FieldMask': 'formattedAddress,addressComponents,location',
            },
        });

        if (!respuesta.ok) {
            throw new Error(`Place Details respondió ${respuesta.status}: ${await respuesta.text()}`);
        }

        res.json(mapPlaces(await respuesta.json()));
    } catch (error) {
        console.error(error);
        res.status(502).json({ mensaje: 'No se pudo obtener la dirección. Probá de nuevo.' });
    }
};

// GET /geo/reverse?lat=-34.60&lon=-58.38
const direccionDesdeCoordenadas = async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({ mensaje: 'Coordenadas inválidas' });
    }
    if (!API_KEY) return sinKey(res);
    if (!consumir('reverse')) return limiteAlcanzado(res);

    try {
        const params = new URLSearchParams({
            latlng: `${lat},${lon}`,
            language: 'es',
            key: API_KEY,
        });

        const respuesta = await fetch(`${GEOCODING_URL}?${params}`);
        const data = await respuesta.json();

        if (data.status === 'ZERO_RESULTS') {
            return res.status(404).json({ mensaje: 'No encontramos una dirección en esa ubicación' });
        }
        if (data.status !== 'OK') {
            throw new Error(`Geocoding respondió ${data.status}: ${data.error_message ?? ''}`);
        }

        res.json(mapGeocoding(data.results[0]));
    } catch (error) {
        console.error(error);
        res.status(502).json({ mensaje: 'No se pudo obtener la dirección. Probá de nuevo.' });
    }
};

module.exports = {
    autocompletar,
    detalleLugar,
    direccionDesdeCoordenadas,
};