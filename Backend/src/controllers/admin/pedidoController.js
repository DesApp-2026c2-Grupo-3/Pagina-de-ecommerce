const { Pedido, DetallePedido, Producto, Admin, Usuario, Direccion, Sucursal, Viaje, historialDeTiemposPedido, sequelize } = require('../../models');
const { devolverStockPedido } = require('../../utils/stockPedido');
const { notificarEstadoPedido } = require('../../notifications/handlers/pedidoHandlers');
const { emitirRefrescoAdmin } = require('../../notifications/adminRefresco');
const { notificarPedidoCanceladoEnViaje, notificarDisponibilidad } = require('../../notifications/handlers/viajeHandlers');
const { catalogoDelPedido } = require('../../utils/catalogoPedido');

// Qué se trae de cada parte del pedido (nunca la contraseña del cliente).
// paranoid: false → los productos eliminados (borrado lógico) se siguen viendo en los pedidos viejos
const DETALLE = {
    model: DetallePedido,
    include: [{ model: Producto, attributes: ['id', 'nombre', 'imagen'], paranoid: false }],
};
const CLIENTE = { model: Usuario, attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] };
const DIRECCION = {
    model: Direccion,
    attributes: ['id', 'alias', 'calle', 'numero', 'piso', 'localidad', 'provincia', 'observaciones', 'latitud', 'longitud'],
    paranoid: false,
};
const SUCURSAL = { model: Sucursal, attributes: ['id', 'nombre'] };
// Línea de tiempo de estados: se devuelve ordenada cronológicamente en el detalle
// `as` explícito: coincide con el alias del modelo y la clave que espera el front (`historialDeTiemposPedidos`)
const HISTORIAL = { model: historialDeTiemposPedido, as: 'historialDeTiemposPedidos', attributes: ['id', 'estado', 'estadoAnterior', 'fecha'] };
// Flujo permitido AL ADMINISTRADOR: desde cada estado, a cuáles puede pasar (en minúscula).
// "En camino" y "Entregado" los marca el repartidor desde su app (pedidoRepartidorController):
// el admin no puede despachar ni entregar a mano, y un pedido en viaje ya no se toca desde el panel.
// Espejo en el panel: TRANSICIONES_ADMIN de admin/src/utils/pedidoEstado.ts
const TRANSICIONES = {
    'pendiente': ['en proceso', 'cancelado'],
    'en proceso': ['listo para retirar', 'cancelado'],
    'listo para retirar': ['cancelado'],
};
// Estados que solo maneja el repartidor
const ESTADOS_DEL_REPARTIDOR = ['en camino', 'entregado'];
// Un pedido en estos estados ya está cerrado: no se puede cambiar
const ESTADOS_FINALES = ['entregado', 'cancelado'];

// Los pedidos viejos pueden tener el estado en minúscula ("pendiente"): se compara sin importar mayúsculas
const mismoEstado = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();

function errorConflicto(mensaje) {
    const error = new Error(mensaje);
    error.statusCode = 409;
    return error;
}

// El master (sin sucursal) puede todo; el admin de sucursal, solo la suya
function puedeVerSucursal(admin, sucursalId) {
    return admin.sucursalId === null || Number(admin.sucursalId) === Number(sucursalId);
}

// GET /admin/pedidos/sucursal/:id            → pedidos de la sucursal, del más nuevo al más viejo
// GET /admin/pedidos/sucursal/:id?estado=... → filtrados por estado
const obtenerPedidosPorSucursal = async (req, res) => {
    try {
        // Auth primero: no se revela si la sucursal existe a quien no tiene sesión
        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const sucursal = await Sucursal.findByPk(req.params.id);
        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }
        if (!puedeVerSucursal(admin, sucursal.id)) {
            return res.status(403).json({ mensaje: 'No tienes permisos para acceder a esta sucursal' });
        }

        const where = { sucursalId: sucursal.id };
        if (req.query.estado) {
            where.estado = req.query.estado;
        }

        const pedidos = await Pedido.findAll({
            where,
            include: [CLIENTE, DETALLE],
            order: [['fecha', 'DESC']],
        });

        res.status(200).json(pedidos);
    } catch (error) {
        console.error('Algo salió mal:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener los pedidos' });
    }
};

// GET /admin/pedidos/:id → detalle completo: productos, cliente, dirección y sucursal.
// Incluye `catalogo` (nombres, recetas y grupos de combo de los productos del pedido e
// insumos de sus personalizaciones): así el admin de sucursal arma "Sin cebolla" o
// "Papas: Papas con cheddar" sin pedir el catálogo completo, que es solo del MASTER.
const obtenerPedidoPorId = async (req, res) => {
    try {
        // Auth primero: no se revela si el pedido existe a quien no tiene sesión
        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const pedido = await Pedido.findByPk(req.params.id, {
            include: [CLIENTE, DIRECCION, SUCURSAL, DETALLE, HISTORIAL],
            order: [
                [{ model: historialDeTiemposPedido, as: 'historialDeTiemposPedidos' }, 'fecha', 'ASC'],
                [{ model: historialDeTiemposPedido, as: 'historialDeTiemposPedidos' }, 'id', 'ASC'],
            ],
        });
        // Sin permiso se responde 404 genérico (no 403): evita confirmar
        // a un admin de otra sucursal que el pedido existe (prevención de IDOR/enumeración)
        if (!pedido || !puedeVerSucursal(admin, pedido.sucursalId)) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }

        const datos = typeof pedido.toJSON === 'function' ? pedido.toJSON() : pedido;
        const catalogo = await catalogoDelPedido(datos.DetallePedidos ?? []);
        res.status(200).json({ ...datos, catalogo });
    } catch (error) {
        console.error('Algo salió mal:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener el pedido' });
    }
};

// PATCH /admin/pedidos/editar/estado/:id → cambia el estado;
// solo devuelve el stock si se cancela desde "Pendiente". Nunca se puede volver a "Pendiente".
const cambiarEstadoPedidoPorId = async (req, res) => {
    try {
        const { estado } = req.body;
        // Al cancelar, el motivo es obligatorio: le llega al cliente en la notificación
        const esCancelacion = mismoEstado(estado, 'cancelado');
        const motivo = typeof req.body.motivo === 'string' ? req.body.motivo.trim() : '';
        // Auth primero: no se revela si el pedido existe a quien no tiene sesión
        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const pedido = await Pedido.findByPk(req.params.id);
        // Sin permiso se responde 404 genérico (no 403): evita confirmar
        // a un admin de otra sucursal que el pedido existe (prevención de IDOR/enumeración)
        if (!pedido || !puedeVerSucursal(admin, pedido.sucursalId)) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }

        if (ESTADOS_FINALES.some((final) => mismoEstado(pedido.estado, final))) {
            return res.status(400).json({
                mensaje: `El pedido ya está ${String(pedido.estado).toLowerCase()} y no se puede modificar`
            });
        }
        if (mismoEstado(estado, pedido.estado)) {
            return res.status(400).json({
                mensaje: `El pedido ya se encuentra en el estado: ${estado}`
            });
        }
        // Una vez que el pedido abandona Pendiente nunca puede volver:
        // Pendiente es solo el estado inicial
        const actual = String(pedido.estado).toLowerCase();
        const destino = String(estado).toLowerCase();
        // Lo que maneja el repartidor no se toca desde el panel
        if (ESTADOS_DEL_REPARTIDOR.includes(actual)) {
            return res.status(400).json({
                mensaje: `El pedido está "${pedido.estado}": lo gestiona el repartidor desde su app`
            });
        }
        if (ESTADOS_DEL_REPARTIDOR.includes(destino)) {
            return res.status(400).json({
                mensaje: `"${estado}" lo marca el repartidor desde su app`
            });
        }
        const permitidos = TRANSICIONES[actual] ?? [];
        if (!permitidos.includes(destino)) {
            return res.status(400).json({
                mensaje: `No se puede pasar de "${pedido.estado}" a "${estado}"`
            });
        }
                if (esCancelacion && (motivo.length < 3 || motivo.length > 200)) {
            return res.status(400).json({
                mensaje: 'Escribí el motivo de la cancelación (entre 3 y 200 caracteres): le llega al cliente'
            });
        }
        // D-08: un pedido "Listo para retirar" se puede cancelar solo si el repartidor no lo retiró
        const cancelaDisponible = mismoEstado(estado, 'cancelado') && actual === 'listo para retirar';

        // El cambio de estado y su registro en la línea de tiempo van juntos
        // (igual que la eventual devolución de stock): o se hacen todos, o ninguno
        const t = await sequelize.transaction();
        const estadoPrevio = pedido.estado;
        let stockDevuelto = false;
        let viajeAfectado = null;
        let viajeEliminado = false;
        try {
            const cambios = { estado };

            // El motivo queda guardado en el pedido (ranking de motivos en los reportes)
            if (esCancelacion) cambios.motivoCancelacion = motivo;
            if (cancelaDisponible) {
                // Se relee bloqueado: el repartidor podría estar retirándolo en este momento
                await pedido.reload({ transaction: t, lock: t.LOCK.UPDATE });

                if (pedido.retiradoEn) {
                    throw errorConflicto('El repartidor ya retiró el pedido: no se puede cancelar');
                }

                if (pedido.viajeId) {
                    viajeAfectado = await Viaje.findByPk(pedido.viajeId, {
                        transaction: t,
                        lock: t.LOCK.UPDATE,
                    });
                    // El pedido sale del viaje en preparación del repartidor
                    cambios.viajeId = null;
                }
            }

            await pedido.update(cambios, { transaction: t });

            if (viajeAfectado) {
                const restantes = await Pedido.count({
                    where: { viajeId: viajeAfectado.id },
                    transaction: t,
                });
                // Un viaje vacío no tiene sentido: se elimina (igual que al quitar el último pedido)
                if (restantes === 0) {
                    await viajeAfectado.destroy({ transaction: t });
                    viajeEliminado = true;
                }
            }

            await historialDeTiemposPedido.create({
                pedidoId: pedido.id,
                estadoAnterior: estadoPrevio,
                estado,
                fecha: new Date(),
            }, { transaction: t });
            // Solo se devuelve el stock si se cancela desde Pendiente (sin preparación iniciada).
            // Desde En proceso / En camino no hay devolución automática: queda para manejo manual.
            if (mismoEstado(estado, 'cancelado') && mismoEstado(estadoPrevio, 'pendiente')) {
                stockDevuelto = (await devolverStockPedido(
                    pedido.id,
                    { transaction: t, adminId: admin.id }
                )) > 0;
            }
            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }

        // Avisos a la app del repartidor (D-08 y refresco de pedidos disponibles, 7.4)
        if (viajeAfectado) {
            await notificarPedidoCanceladoEnViaje({ pedido, viaje: viajeAfectado, viajeEliminado });
        } else if (cancelaDisponible) {
            await notificarDisponibilidad({ pedido, accion: 'eliminado' });
        } else if (mismoEstado(estado, 'listo para retirar')) {
            await notificarDisponibilidad({ pedido, accion: 'creado' });
        }

        if (stockDevuelto) {
            await emitirRefrescoAdmin({
                dominio: 'stock',
                accion: 'actualizado',
                sucursalId: pedido.sucursalId,
                recursos: { pedidoId: pedido.id },
            });
        }

        await notificarEstadoPedido(pedido, estadoPrevio, esCancelacion ? motivo : null);
        
        res.status(200).json(pedido);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ mensaje: error.message });
        }
        console.error('Algo salió mal:', error.message);
        res.status(500).json({ mensaje: 'Error al cambiar el estado del pedido' });
    }
};

module.exports = {
    obtenerPedidosPorSucursal,
    obtenerPedidoPorId,
    cambiarEstadoPedidoPorId,
};