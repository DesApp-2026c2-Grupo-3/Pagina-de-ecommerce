const { StockSucursal, Insumo } = require('../../models');

// Grilla de stock de una sucursal (pantalla del encargado)
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
                bajoMinimo: stockMinimo !== null && cantidad < stockMinimo,
            };
        });

        return res.status(200).json(stockConIndicador);
    } catch (error) {
        console.error('Algo salió mal', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// Carga un aumento de cantidad (suma, no pisa el valor)
const cargarAumento = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;

        const stock = await StockSucursal.findByPk(id);

        if (!stock) {
            return res.status(404).json({ mensaje: 'Registro de stock no encontrado' });
        }

        const nuevaCantidad = Number(stock.cantidad) + Number(cantidad);

        await stock.update({ cantidad: nuevaCantidad });

        return res.status(200).json({
            mensaje: 'Stock actualizado con éxito',
            stock,
        });
    } catch (error) {
        console.error('Algo salió mal', error.message);
        return res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = {
    obtenerStockPorSucursal,
    cargarAumento,
};