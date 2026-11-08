const {
    Producto, ProductoTamanio, RecetaInsumo, StockSucursal, SuspensionProducto, Sucursal, Admin, sequelize,
} = require('../../models');
const { ROLES } = require('../../config/roles');
const { agruparPorProducto, stockComoMapa, productoDisponible, factorMinimo } = require('../../utils/disponibilidad');

const MOTIVO_MASTER = 'Deshabilitado por la administración';

// Quién hace la acción decide el origen: el master deshabilita (indefinido), el encargado suspende (transitorio).
// Levantar: el encargado solo levanta lo suyo; el master levanta cualquier suspensión, incluida la del encargado.
const origenDe = (usuario) => (usuario.rol === ROLES.MASTER ? 'MASTER' : 'ENCARGADO');

const datosDe = (s) => s && ({
    id: s.id,
    motivo: s.motivo,
    desde: s.createdAt,
    por: s.creadaPor ? { id: s.creadaPor.id, nombre: s.creadaPor.nombre } : null,
});

// GET /admin/suspensiones/sucursal/:id/productos
// Todos los productos con su estado en esa sucursal: disponible, sin-stock, suspendido (encargado) o deshabilitado (master).
const productosDeSucursal = async (req, res) => {
    try {
        const sucursalId = Number(req.params.id);
        const sucursal = await Sucursal.findByPk(sucursalId, { attributes: ['id', 'nombre'] });
        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }

        const [productos, recetas, stock, activas] = await Promise.all([
            Producto.findAll({
                attributes: ['id', 'nombre', 'categoriaId', 'disponible'],
                include: [{ model: ProductoTamanio, as: 'tamanios', attributes: ['tamanioId', 'factorStock'] }],
                order: [['nombre', 'ASC']],
            }),
            RecetaInsumo.findAll({ attributes: ['productoId', 'insumoId', 'cantidadBase'] }),
            StockSucursal.findAll({ where: { sucursalId }, attributes: ['insumoId', 'cantidad'] }),
            SuspensionProducto.findAll({
                where: { sucursalId, rehabilitadaEn: null },
                include: [{ model: Admin, as: 'creadaPor', attributes: ['id', 'nombre'] }],
            }),
        ]);

        const recetasPorProducto = agruparPorProducto(recetas);
        const stockPorInsumo = stockComoMapa(stock);

        // productoId -> { ENCARGADO: fila, MASTER: fila }
        const activasPorProducto = new Map();
        for (const s of activas) {
            const porOrigen = activasPorProducto.get(s.productoId) ?? {};
            porOrigen[s.origen] = s;
            activasPorProducto.set(s.productoId, porOrigen);
        }

        const miOrigen = origenDe(req.usuario);
        const lista = productos.map((p) => {
            const suyas = activasPorProducto.get(p.id) ?? {};
            const sinStock = !productoDisponible(
                { id: p.id, disponible: true }, recetasPorProducto.get(p.id), stockPorInsumo, factorMinimo(p.tamanios ?? []),
            );
            let estado = 'disponible';
            if (!p.disponible || suyas.MASTER) estado = 'deshabilitado';
            else if (suyas.ENCARGADO) estado = 'suspendido';
            else if (sinStock) estado = 'sin-stock';

            return {
                id: p.id,
                nombre: p.nombre,
                categoriaId: p.categoriaId,
                estado,
                sinStock,
                deshabilitadoGlobal: !p.disponible,
                deshabilitadoEnSucursal: datosDe(suyas.MASTER) ?? null,
                suspension: datosDe(suyas.ENCARGADO) ?? null,
                // Si quien consulta puede levantar lo que tiene el producto en esta sucursal:
                // el master, cualquier suspensión; el encargado, solo la suya
                puedeRehabilitar: miOrigen === 'MASTER' ? Boolean(suyas.MASTER || suyas.ENCARGADO) : Boolean(suyas.ENCARGADO),
            };
        });

        // Lo que deshabilitó la administración no le corresponde al encargado: no lo ve en su lista.
        // Sí ve lo suspendido en su sucursal, también por otro encargado.
        res.json(miOrigen === 'MASTER' ? lista : lista.filter((p) => p.estado !== 'deshabilitado'));
    } catch (error) {
        console.error('Error al obtener los productos de la sucursal:', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// POST /admin/suspensiones/sucursal/:id/suspender   { productoIds: [..], motivo }
const suspender = async (req, res) => {
    const origen = origenDe(req.usuario);
    let motivo = (req.body.motivo ?? '').trim();
    if (origen === 'ENCARGADO' && motivo.length < 5) {
        return res.status(400).json({ code: 'Contá brevemente el motivo de la suspensión (al menos 5 caracteres)' });
    }
    if (!motivo) motivo = MOTIVO_MASTER;

    const t = await sequelize.transaction();
    try {
        const sucursalId = Number(req.params.id);
        const { productoIds } = req.body;

        const sucursal = await Sucursal.findByPk(sucursalId, { attributes: ['id'], transaction: t });
        if (!sucursal) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }

        const existentes = await Producto.findAll({ where: { id: productoIds }, attributes: ['id'], transaction: t });
        if (existentes.length !== productoIds.length) {
            await t.rollback();
            return res.status(404).json({ code: 'Alguno de los productos no existe' });
        }

        // Los que ya tienen una suspensión activa del mismo origen se saltean
        const yaSuspendidos = await SuspensionProducto.findAll({
            where: { sucursalId, origen, rehabilitadaEn: null, productoId: productoIds },
            attributes: ['productoId'],
            transaction: t,
        });
        const yaEstan = new Set(yaSuspendidos.map((s) => s.productoId));
        const nuevos = productoIds.filter((id) => !yaEstan.has(id));

        if (nuevos.length > 0) {
            await SuspensionProducto.bulkCreate(
                nuevos.map((productoId) => ({ productoId, sucursalId, origen, motivo, creadaPorId: req.usuario.id })),
                { transaction: t },
            );
        }

        await t.commit();
        return res.status(201).json({ suspendidos: nuevos.length, yaSuspendidos: yaEstan.size });
    } catch (error) {
        await t.rollback();
        console.error('Error al suspender productos:', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// POST /admin/suspensiones/sucursal/:id/rehabilitar   { productoIds: [..] }
// Rehabilitar no borra: completa quién y cuándo. El encargado levanta solo lo que puso su propio origen;
// el master levanta cualquier suspensión de la sucursal, también las del encargado.
const rehabilitar = async (req, res) => {
    try {
        const sucursalId = Number(req.params.id);
        const { productoIds } = req.body;
        const origen = origenDe(req.usuario);

        const donde = { sucursalId, rehabilitadaEn: null, productoId: productoIds };
        if (origen === 'ENCARGADO') donde.origen = 'ENCARGADO';

        const activas = await SuspensionProducto.findAll({ where: donde, attributes: ['productoId'] });

        if (activas.length === 0) {
            // Solo el encargado puede chocar con una suspensión ajena: la que puso el master
            if (origen === 'ENCARGADO') {
                const ajenas = await SuspensionProducto.count({
                    where: { sucursalId, rehabilitadaEn: null, productoId: productoIds },
                });
                if (ajenas > 0) {
                    return res.status(403).json({
                        code: 'Esos productos fueron deshabilitados por la administración: solo ella puede habilitarlos',
                    });
                }
            }
            return res.status(404).json({ code: 'Esos productos no están suspendidos' });
        }

        await SuspensionProducto.update(
            { rehabilitadaEn: new Date(), rehabilitadaPorId: req.usuario.id },
            { where: donde },
        );

        // Un producto puede tener a la vez la suspensión del encargado y la del master: cuenta una sola vez
        const rehabilitados = new Set(activas.map((s) => s.productoId)).size;
        return res.status(200).json({ rehabilitados, noRehabilitados: productoIds.length - rehabilitados });
    } catch (error) {
        console.error('Error al rehabilitar productos:', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// GET /admin/suspensiones?estado=activas|historial&sucursalId=
// El master ve las de todas las sucursales (puede filtrar); el encargado, las de la suya (sin lo que deshabilitó
// la administración). Solo lectura.
const listar = async (req, res) => {
    try {
        const esMaster = req.usuario.rol === ROLES.MASTER;
        const where = {};
        if (esMaster) {
            if (req.query.sucursalId) where.sucursalId = Number(req.query.sucursalId);
        } else {
            where.sucursalId = req.usuario.sucursalId;
            // Lo que deshabilitó la administración no le corresponde al encargado
            where.origen = 'ENCARGADO';
        }
        if (req.query.estado !== 'historial') where.rehabilitadaEn = null;

        const filas = await SuspensionProducto.findAll({
            where,
            include: [
                { model: Producto, attributes: ['id', 'nombre'], paranoid: false },
                { model: Sucursal, attributes: ['id', 'nombre'] },
                { model: Admin, as: 'creadaPor', attributes: ['id', 'nombre'] },
                { model: Admin, as: 'rehabilitadaPor', attributes: ['id', 'nombre'] },
            ],
            order: [['createdAt', 'DESC']],
            limit: 200,
        });

        res.json(filas.map((s) => ({
            id: s.id,
            origen: s.origen,
            motivo: s.motivo,
            desde: s.createdAt,
            producto: s.Producto ? { id: s.Producto.id, nombre: s.Producto.nombre } : null,
            sucursal: s.Sucursal ? { id: s.Sucursal.id, nombre: s.Sucursal.nombre } : null,
            creadaPor: s.creadaPor ? { id: s.creadaPor.id, nombre: s.creadaPor.nombre } : null,
            rehabilitadaPor: s.rehabilitadaPor ? { id: s.rehabilitadaPor.id, nombre: s.rehabilitadaPor.nombre } : null,
            rehabilitadaEn: s.rehabilitadaEn,
        })));
    } catch (error) {
        console.error('Error al listar las suspensiones:', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = { productosDeSucursal, suspender, rehabilitar, listar };
