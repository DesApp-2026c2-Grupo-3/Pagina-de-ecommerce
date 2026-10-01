const { Pedido, DetallePedido, Producto, Usuario, Sucursal, Direccion, RecetaInsumo, Insumo, StockSucursal, sequelize, ProductoVariante } = require("../models");
//Solo para pruebas
const obtenerPedidos = async (req,res) => {
    try{

        const pedidos = await Pedido.findAll({include: [{model: DetallePedido, include: [Producto]}]})

        res.status(200).json(pedidos)

    } catch(error){
        console.error('Algo salio mal', error.message)
        res.status(500).json({mensaje: 'Error del servidor'})
    }

}

const obtenerPedidosPorUsuario = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      where: { usuarioId: req.params.usuarioId },
      include: [{ model: DetallePedido, include: [Producto] }],
      order: [['fecha', 'DESC']],
    });

    res.status(200).json(pedidos);
  } catch (error) {
    console.error('Algo salió mal', error.message);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

const obtenerPedidoId = async (req,res) => {
    try{
        const pedido = await Pedido.findByPk(req.params.id, {
            include: [{ model: DetallePedido, include: [Producto]}]
        });

        if (!pedido) {
            return res.status(404).json({
                mensaje: 'Pedido no encontrado'
            });
        }

        res.json(pedido);
    } catch(error){
        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener el pedido'
        });
    };
};

const crearPedido = async (req,res) => {

    const t = await sequelize.transaction();

    try{
        const { usuarioId, productos, direccionId, sucursalId } = req.body;
        const usuario = await Usuario.findByPk(usuarioId);

        if(!usuario){
            await t.rollback();
            return res.status(404).json({ mensaje: 'Usuario no encontrado'})
        }

        const sucursal = await Sucursal.findByPk(sucursalId);
        if(!sucursal){
            await t.rollback();
            return res.status(404).json({ mensaje: 'Sucursal no encontrada'})
        }

        const direccion = await Direccion.findOne({ where: { id: direccionId, usuarioId } });
        if (!direccion) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'Dirección no encontrada' });
        }        

         // Verificar que haya productos
        if (!Array.isArray(productos) || productos.length === 0) {
            await t.rollback();
            return res.status(400).json({
                mensaje: 'El pedido debe contener al menos un producto'
            });
        }

        const nuevoPedido = await Pedido.create({
            usuarioId, direccionId, sucursalId, fecha: new Date(), total: 0
        }, { transaction: t});

        let total = 0;

        // Recorrer los productos recibidos
        for ( const producto of productos){
            
            if (!producto.productoId || !producto.cantidad) {
                await t.rollback();
                return res.status(400).json({
                    mensaje: 'Cada producto debe tener productoId y cantidad'
                });
            }

            if (producto.cantidad <= 0) {
                await t.rollback();
                return res.status(400).json({
                    mensaje: 'La cantidad debe ser mayor a 0'
                });
            }

            const productoBD = await Producto.findByPk(producto.productoId, {
                include: [{ model: ProductoVariante, as: 'variantes' }]
            });
            if (!productoBD) {
                await t.rollback();
                return res.status(404).json({
                    mensaje: `No existe el producto con id ${producto.productoId}`
                });
            }

            if (!productoBD.disponible) {
                await t.rollback();
                return res.status(400).json({
                    mensaje: `El producto ${productoBD.nombre} no está disponible`
                });
            }
            // Si el producto tiene tamaños, el precio base es el del tamaño elegido
            const variantes = productoBD.variantes ?? [];
            let precioBase = Number(productoBD.precio);
            let tamanio = null;

            if (variantes.length > 0) {
                const variante = variantes.find((v) => v.tamanio === producto.tamanio);
                if (!variante) {
                    await t.rollback();
                    return res.status(400).json({
                        mensaje: `Elegí un tamaño válido para ${productoBD.nombre}`
                    });
                }
                precioBase = Number(variante.precio);
                tamanio = variante.tamanio;
            }

            // Cantidad final elegida por insumo (insumoId -> cantidad), solo para los insumos
            // que el cliente tocó respecto de la receta base.
            const personalizaciones = Array.isArray(producto.personalizaciones)
                ? producto.personalizaciones
                : [];
            const cantidadElegidaPorInsumo = new Map(
                personalizaciones.map((p) => [Number(p.insumoId), Number(p.cantidad)])
            );

            const receta = await RecetaInsumo.findAll({
                where: { productoId: producto.productoId },
                include: [Insumo],
                transaction: t
            });

            const recetaPorInsumo = new Map(receta.map((item) => [item.insumoId, item]));

            // Toda personalización debe referirse a un insumo real de la receta de este producto,
            // y respetar lo que la receta permite (esRemovible habilita bajar, esAgregable habilita subir).
            for (const [insumoId, cantidad] of cantidadElegidaPorInsumo) {
                const item = recetaPorInsumo.get(insumoId);
                if (!item) {
                    await t.rollback();
                    return res.status(400).json({
                        mensaje: `El insumo ${insumoId} no pertenece a la receta de ${productoBD.nombre}`
                    });
                }
                const base = Number(item.cantidadBase);
                if (cantidad < base && !item.esRemovible) {
                    await t.rollback();
                    return res.status(400).json({
                        mensaje: `El insumo ${item.Insumo?.nombre ?? insumoId} no se puede sacar de ${productoBD.nombre}`
                    });
                }
                if (cantidad > base && !item.esAgregable) {
                    await t.rollback();
                    return res.status(400).json({
                        mensaje: `El insumo ${item.Insumo?.nombre ?? insumoId} no se puede aumentar en ${productoBD.nombre}`
                    });
                }
            }

            let extraUnitario = 0;

            for (const item of receta) {
                const base = Number(item.cantidadBase);
                const cantidadFinal = cantidadElegidaPorInsumo.has(item.insumoId)
                    ? cantidadElegidaPorInsumo.get(item.insumoId)
                    : base;

                const cantidadNecesaria = cantidadFinal * producto.cantidad;
                const extra = Math.max(0, cantidadFinal - base);

                if (extra > 0 && item.Insumo && item.Insumo.precioComercial != null) {
                    extraUnitario += extra * Number(item.Insumo.precioComercial);
                }

                if (cantidadNecesaria <= 0) continue;

                const stock = await StockSucursal.findOne({
                    where: { insumoId: item.insumoId, sucursalId },
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                if (!stock) {
                    await t.rollback();
                    return res.status(400).json({
                        mensaje: `No hay stock cargado para un insumo de ${productoBD.nombre} en esta sucursal`
                    });
                }

                if (Number(stock.cantidad) < cantidadNecesaria) {
                    await t.rollback();
                    return res.status(400).json({
                        mensaje: `Stock insuficiente para preparar ${productoBD.nombre} en esta sucursal`
                    });
                }

                await stock.update(
                    { cantidad: Number(stock.cantidad) - cantidadNecesaria },
                    { transaction: t }
                );
            }

            // Calcular subtotal (precio base + extras agregados, la personalización de sacar no descuenta)
            const precioUnitario = precioBase + extraUnitario;            
            const subtotal = precioUnitario * producto.cantidad;

            // Acumular al total
            total += subtotal;

            await DetallePedido.create({
                pedidoId: nuevoPedido.id,
                productoId: producto.productoId,
                cantidad: producto.cantidad,
                precio: precioUnitario,
                tamanio: tamanio,
                personalizaciones
            },{transaction: t});
        }

        await nuevoPedido.update({ total: total }, {transaction: t});

        await t.commit();

        return res.status(201).json(nuevoPedido)

    } catch (error){

        await t.rollback();

        console.error('Algo salio mal', error.message)

        return res.status(500).json({mensaje: 'Error del servidor'})
    }
};


//const obtenerHistorialPedido = async (req,res) => {};


module.exports = { obtenerPedidos, obtenerPedidoId, crearPedido, obtenerPedidosPorUsuario };