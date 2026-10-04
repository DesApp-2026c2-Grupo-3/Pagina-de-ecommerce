// Distancia en línea recta entre dos puntos del mapa, en km (fórmula de Haversine)
function distanciaKm(a, b) {
    const RADIO_TIERRA_KM = 6371;
    const rad = (grados) => (grados * Math.PI) / 180;

    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;

    return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

module.exports = { distanciaKm };