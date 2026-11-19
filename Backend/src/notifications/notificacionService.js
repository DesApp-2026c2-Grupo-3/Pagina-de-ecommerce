'use strict';

class NotificacionService {
    constructor({ repository, canales = [] }) {
        this.repository = repository;
        this.canales = canales;
    }

    usarCanal(canal) {
        this.canales.push(canal);
        return this;
    }

    async publicar({ tipo, datos, destinos = {}, version = 1, ocurridoEn = new Date() }) {
        try {
            const notificacion = await this.repository.guardar({
                tipo,
                datos,
                destinos,
                version,
                ocurridoEn,
            });

            await Promise.allSettled(
                this.canales.map((canal) => canal.enviar(notificacion))
            );

            return notificacion;
        } catch (error) {
            console.error('No se pudo publicar la notificación:', error.message);
            return null;
        }
    }

    async emitirLeida({ destinatarioTipo, destinatarioId, notificacionId, leidaEn, todas = false }) {
        await Promise.allSettled(
            this.canales.map((canal) => {
                if (typeof canal.emitirLeida !== 'function') return null;
                return canal.emitirLeida({
                    destinatarioTipo,
                    destinatarioId,
                    notificacionId,
                    leidaEn,
                    todas,
                });
            })
        );
    }
}

module.exports = { NotificacionService };
