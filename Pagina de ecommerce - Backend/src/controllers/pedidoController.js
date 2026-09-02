const { Pedido, DetallePedido, Producto, Usuario, sequelize } = require("../models");

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
        const { usuarioId, productos } = req.body;

        const usuario = await Usuario.findByPk(usuarioId);

        if(!usuario){
            return res.status(404).json({ mensaje: 'Usuario no encontrado'})
        }

         // Verificar que haya productos
        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({
                mensaje: 'El pedido debe contener al menos un producto'
            });
        }

        const nuevoPedido = await Pedido.create({
            usuarioId, fecha: new Date(), total: 0
        }, { transaction: t});

        let total = 0;

        // Recorrer los productos recibidos
        for ( const producto of productos){
            
            if (!producto.productoId || !producto.cantidad) {
                return res.status(400).json({
                    mensaje: 'Cada producto debe tener productoId y cantidad'
        });
    }

    if (producto.cantidad <= 0) {
        return res.status(400).json({
            mensaje: 'La cantidad debe ser mayor a 0'
        });
    }

            const productoBD = await Producto.findByPk(producto.productoId);

            if (!productoBD) {
                return res.status(404).json({
                    mensaje: `No existe el producto con id ${producto.productoId}`
                });
            }

            if (!productoBD.disponible) {
        return res.status(400).json({
            mensaje: `El producto ${productoBD.nombre} no está disponible`
        });
    }

            // Calcular subtotal
            const subtotal = Number(productoBD.precio) * producto.cantidad;

            // Acumular al total
            total += subtotal;

            await DetallePedido.create({
                pedidoId: nuevoPedido.id,
                productoId: producto.productoId,
                cantidad: producto.cantidad,
                precio: productoBD.precio
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


module.exports = { obtenerPedidos, obtenerPedidoId, crearPedido }