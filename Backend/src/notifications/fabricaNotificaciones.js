'use strict';

function crearFabricaNotificaciones({ notificacionService, registro }) {
    if (!notificacionService) {
        throw new Error('La fábrica de notificaciones requiere un servicio');
    }

    if (!registro) {
        throw new Error('La fábrica de notificaciones requiere un registro de estrategias');
    }

    async function publicarPorTipo(tipo, payload) {
        try {
            const estrategia = registro.obtenerEstrategia(tipo);

            if (!estrategia) {
                console.error(`Tipo de notificación no registrado: ${tipo}`);
                return null;
            }

            const { datos, destinos } = estrategia.construir(payload);

            return await notificacionService.publicar({
                tipo: estrategia.tipo,
                version: estrategia.version,
                datos,
                destinos,
            });
        } catch (error) {
            console.error(`No se pudo construir la notificación ${tipo}:`, error.message);
            return null;
        }
    }

    return { publicarPorTipo };
}

module.exports = { crearFabricaNotificaciones };
