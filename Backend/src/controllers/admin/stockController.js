const { StockSucursal, Insumo, MovimientoStock, Admin, sequelize } = require('../../models');

const redondear = (n) => Math.round(n * 1000) / 1000;

// Solo se registra el admin si existe (así un id viejo no rompe el movimiento)
async function adminValido(adminId, transaction) {
    if (!adminId) return null;
    const admin = await Admin.findByPk(adminId, { attributes: ['id'], transaction });
    return admin ? admin.id : null;
}

// GET /admin/stock/sucursal/:id → grilla de stock de una sucursal
const obtenerStockPorSucursal = async (req, res) => {
    try {
        const { id: sucursalId } = req.params;

        const stock = await StockSucursal.findAll({
            where: { sucursalId },
            include: [{ model: Insumo, attributes: ['id', 'nombre', 'unidadMedida'] }],
            order: [[Insumo, 'nombre', 'ASC']],
        });

        const stockConIndicador = stock.map((item) => {
            const cantidad = Number(item.cantidad);
            const stockMinimo = item.stockMinimo !== null ? Number(item.stockMinimo) : null;

            return {
                id: item.id,
                insumoId: item.insumoId,
                sucursalId: item.sucursalId,
                nombre: item.Insumo?.nombre,
                unidadMedida: item.Insumo?.unidadMedida,
                cantidad,
                stockMinimo,
                bajoMinimo: stockMinimo !== null && cantidad <= stockMinimo,            };
        });

        return res.status(200).json(stockConIndicador);
    } catch (error) {
        console.error('Algo salió mal', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// PATCH /admin/stock/:id/aumentar → suma (no pisa) y lo registra en el historial
const cargarAumento = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const stock = await StockSucursal.findByPk(req.params.id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (!stock) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'Registro de stock no encontrado' });
        }

        const anterior = Number(stock.cantidad);
        const nueva = redondear(anterior + Number(req.body.cantidad));

        await stock.update({ cantidad: nueva }, { transaction: t });
        await MovimientoStock.create({
            sucursalId: stock.sucursalId,
            insumoId: stock.insumoId,
            tipo: 'aumento',
            cantidad: req.body.cantidad,
            cantidadAnterior: anterior,
            cantidadNueva: nueva,
            adminId: await adminValido(req.body.adminId, t),
        }, { transaction: t });

        await t.commit();
        return res.status(200).json({ mensaje: 'Stock actualizado con éxito', stock });
    } catch (error) {
        await t.rollback();
        console.error('Algo salió mal', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// PATCH /admin/stock/:id/bajar → resta, con motivo obligatorio, y lo registra en el historial
const registrarBaja = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Se bloquea solo la fila de stock (PostgreSQL no permite bloquear con un include)
        const stock = await StockSucursal.findByPk(req.params.id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (!stock) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'Registro de stock no encontrado' });
        }

        const anterior = Number(stock.cantidad);
        const { cantidad, motivo, detalle } = req.body;

        // El stock nunca queda negativo
        if (Number(cantidad) > anterior) {
            const insumo = await Insumo.findByPk(stock.insumoId, {
                attributes: ['nombre', 'unidadMedida'],
                transaction: t,
            });
            await t.rollback();
            return res.status(400).json({
                code: `No se puede bajar más de lo que hay: quedan ${anterior} de ${insumo?.nombre ?? 'este insumo'}`            });
        }

        const nueva = redondear(anterior - Number(cantidad));

        await stock.update({ cantidad: nueva }, { transaction: t });
        await MovimientoStock.create({
            sucursalId: stock.sucursalId,
            insumoId: stock.insumoId,
            tipo: 'baja',
            cantidad,
            cantidadAnterior: anterior,
            cantidadNueva: nueva,
            motivo,
            detalle: detalle || null,
            adminId: await adminValido(req.body.adminId, t),
        }, { transaction: t });

        await t.commit();
        return res.status(200).json({ mensaje: 'Baja registrada con éxito', stock });
    } catch (error) {
        await t.rollback();
        console.error('Algo salió mal', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// GET /admin/stock/sucursal/:id/movimientos → los últimos 50 movimientos de la sucursal
const obtenerMovimientos = async (req, res) => {
    try {
        const movimientos = await MovimientoStock.findAll({
            where: { sucursalId: req.params.id },
            include: [
                { model: Insumo, attributes: ['nombre', 'unidadMedida'] },
                { model: Admin, attributes: ['nombre'] },
            ],
            order: [['createdAt', 'DESC']],
            limit: 50,
        });

        return res.status(200).json(movimientos.map((m) => ({
            id: m.id,
            fecha: m.createdAt,
            tipo: m.tipo,
            insumo: m.Insumo?.nombre ?? 'Insumo eliminado',
            unidadMedida: m.Insumo?.unidadMedida ?? '',
            cantidad: Number(m.cantidad),
            cantidadAnterior: Number(m.cantidadAnterior),
            cantidadNueva: Number(m.cantidadNueva),
            motivo: m.motivo,
            detalle: m.detalle,
            admin: m.Admin?.nombre ?? null,
        })));
    } catch (error) {
        console.error('Algo salió mal', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};
// PATCH /admin/stock/:id/minimo → define el valor de alerta de un insumo en la sucursal
const definirMinimo = async (req, res) => {
    try {
        const stock = await StockSucursal.findByPk(req.params.id);
        if (!stock) {
            return res.status(404).json({ mensaje: 'Registro de stock no encontrado' });
        }

        await stock.update({ stockMinimo: req.body.stockMinimo });
        return res.status(200).json({ mensaje: 'Mínimo actualizado', stock });
    } catch (error) {
        console.error('Algo salió mal', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = {
    obtenerStockPorSucursal,
    cargarAumento,
    registrarBaja,
    obtenerMovimientos,
    definirMinimo,
};