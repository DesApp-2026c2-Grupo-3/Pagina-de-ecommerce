const { precioMasBarato } = require('../utils/combo');
const {
    Pedido,
    DetallePedido,
    Producto,
    Usuario,
    Direccion,
    Sucursal,
    RecetaInsumo,
    ComboGrupo,
    Insumo,
    ProductoTamanio,
    StockSucursal,
    MovimientoStock,
    sequelize,
} = require('../models');
const { distanciaKm } = require('../utils/distancia');
const { pasoExtra } = require('../utils/disponibilidad');

// Cuántas unidades de más se pueden pedir de un ingrediente (igual que el front)
const EXTRA_MAX_INCREMENTO = 3;

// Error "esperable" (datos inválidos, sin stock...): corta el pedido y responde con este estado
class ErrorPedido extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

const redondear = (n) => Math.round(n * 1000) / 1000;

// Descuenta stock de un insumo en la sucursal, con lock de fila dentro de la transacción,
// y lo registra en el historial como venta del pedido
async function descontarStock({ insumoId, cantidad, sucursalId, nombreProducto, pedidoId, t }) {
    if (cantidad <= 0) return;

    const stock = await StockSucursal.findOne({
        where: { insumoId, sucursalId },
        transaction: t,
        lock: t.LOCK.UPDATE
    });

    if (!stock) {
        throw new ErrorPedido(400, `No hay stock cargado para un insumo de ${nombreProducto} en esta sucursal`);
    }

    const anterior = Number(stock.cantidad);
    if (anterior < cantidad) {
        throw new ErrorPedido(400, `Stock insuficiente para preparar ${nombreProducto} en esta sucursal`);
    }

    const nueva = redondear(anterior - cantidad);
    await stock.update({ cantidad: nueva }, { transaction: t });
    await MovimientoStock.create({
        sucursalId,
        insumoId,
        tipo: 'venta',
        cantidad,
        cantidadAnterior: anterior,
        cantidadNueva: nueva,
        pedidoId,
    }, { transaction: t });
}

// Valida lo que el cliente eligió para un grupo del combo y calcula su recargo y su consumo de stock.
// El recargo es la diferencia contra la opción incluida en el precio del combo (grupo.productoIncluidoId).
async function resolverEleccionCombo({ grupo, productoId, tamanioId, combo, t }) {
    if (!tamanioId) {
        throw new ErrorPedido(400, `Elegí un tamaño válido para ${combo.nombre}`);
    }

    const elegido = await Producto.findByPk(productoId, {
        include: [{ model: ProductoTamanio, as: 'tamanios' }],
        transaction: t
    });

    if (!elegido) {
        throw new ErrorPedido(404, `No existe el producto con id ${productoId}`);
    }
    if (!elegido.disponible) {
        throw new ErrorPedido(400, `El producto ${elegido.nombre} no está disponible`);
    }
    if (elegido.categoriaId !== grupo.categoriaId) {
        throw new ErrorPedido(400, `${elegido.nombre} no es una opción válida de ${grupo.nombre} para ${combo.nombre}`);
    }

    const tamanio = (elegido.tamanios ?? []).find((pt) => pt.tamanioId === Number(tamanioId));
    if (!tamanio) {
        throw new ErrorPedido(400, `${elegido.nombre} no está disponible en ese tamaño`);
    }

    const referencia = await precioMasBarato(grupo.categoriaId, tamanio.tamanioId, t);
    const recargo = referencia === null ? 0 : Math.max(0, Number(tamanio.precio) - referencia);

    const receta = await RecetaInsumo.findAll({ where: { productoId: elegido.id }, transaction: t });

    return { elegido, tamanio, recargo, receta };
}
//Solo para pruebas
const obtenerPedidos = async (req,res) => {
    try{

        const pedidos = await Pedido.findAll({include: [{model: DetallePedido, include: [{ model: Producto, paranoid: false }] }]})

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
include: [{ model: DetallePedido, include: [{ model: Producto, paranoid: false }] }],      order: [['fecha', 'DESC']],
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
            include: [{ model: DetallePedido, include: [{ model: Producto, paranoid: false }] }]
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
                // La sucursal tiene que estar activa y llegar a la dirección
        if (!sucursal.activa) {
            throw new ErrorPedido(400, `${sucursal.nombre} no está tomando pedidos en este momento`);
        }
        if (direccion.latitud == null || direccion.longitud == null) {
            throw new ErrorPedido(400, 'Tu dirección no tiene ubicación en el mapa. Editala para completarla.');
        }
        const distancia = distanciaKm(
            { lat: Number(direccion.latitud), lng: Number(direccion.longitud) },
            { lat: Number(sucursal.latitud), lng: Number(sucursal.longitud) }
        );
        if (distancia > Number(sucursal.radioEntregaKm)) {
            throw new ErrorPedido(400, `Tu dirección está fuera de la zona de entrega de ${sucursal.nombre}`);
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
                throw new ErrorPedido(400, 'Cada producto debe tener productoId y cantidad');
            }

            if (producto.cantidad <= 0) {
                throw new ErrorPedido(400, 'La cantidad debe ser mayor a 0');
            }

            const productoBD = await Producto.findByPk(producto.productoId, {
                include: [{ model: ProductoTamanio, as: 'tamanios' }]
            });
            if (!productoBD) {
                throw new ErrorPedido(404, `No existe el producto con id ${producto.productoId}`);
            }

            if (!productoBD.disponible) {
                throw new ErrorPedido(400, `El producto ${productoBD.nombre} no está disponible`);
            }

            // Si el producto tiene tamaños, el precio base es el del tamaño elegido
            const tamanios = productoBD.tamanios ?? [];
            let precioBase = Number(productoBD.precio);
            let tamanioElegido = null;

            if (tamanios.length > 0) {
                tamanioElegido = tamanios.find((pt) => pt.tamanioId === Number(producto.tamanioId));
                if (!tamanioElegido) {
                    throw new ErrorPedido(400, `Elegí un tamaño válido para ${productoBD.nombre}`);
                }
                precioBase = Number(tamanioElegido.precio);
            }
            const factorTamanio = tamanioElegido ? Number(tamanioElegido.factorStock ?? 1) : 1;

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
                    throw new ErrorPedido(400, `El insumo ${insumoId} no pertenece a la receta de ${productoBD.nombre}`);
                }
                const base = Number(item.cantidadBase);
                if (cantidad < base && !item.esRemovible) {
                    throw new ErrorPedido(400, `El insumo ${item.Insumo?.nombre ?? insumoId} no se puede sacar de ${productoBD.nombre}`);
                }
                if (cantidad > base && !item.esAgregable) {
                    throw new ErrorPedido(400, `El insumo ${item.Insumo?.nombre ?? insumoId} no se puede aumentar en ${productoBD.nombre}`);
                }
                if (cantidad - base > EXTRA_MAX_INCREMENTO * pasoExtra(base)) {
                    throw new ErrorPedido(400, `No se pueden agregar más de ${EXTRA_MAX_INCREMENTO} ${item.Insumo?.nombre ?? 'unidades'} extra`);
                }
            }

            // Combos: la tabla ComboGrupos dice qué lugares tiene (acompañamiento, bebida, ...).
            // El producto elegido en cada uno, en el tamaño del combo, aporta su propia receta.
            const grupos = await ComboGrupo.findAll({
                where: { productoId: producto.productoId },
                order: [['orden', 'ASC']],
                transaction: t
            });
            const eleccionesPedidas = Array.isArray(producto.elecciones) ? producto.elecciones : [];

            if (grupos.length === 0 && eleccionesPedidas.length > 0) {
                throw new ErrorPedido(400, `${productoBD.nombre} no es un combo`);
            }

            const elecciones = [];
            const gruposElegidos = new Set();
            for (const pedida of eleccionesPedidas) {
                const grupo = grupos.find((g) => g.id === Number(pedida.grupoId));
                if (!grupo) {
                    throw new ErrorPedido(400, `El grupo ${pedida.grupoId} no pertenece a ${productoBD.nombre}`);
                }
                if (gruposElegidos.has(grupo.id)) {
                    throw new ErrorPedido(400, `Elegiste dos veces ${grupo.nombre} en ${productoBD.nombre}`);
                }
                gruposElegidos.add(grupo.id);
                elecciones.push({
                    grupo,
                    ...(await resolverEleccionCombo({
                        grupo,
                        productoId: pedida.productoId,
                        tamanioId: producto.tamanioId,
                        combo: productoBD,
                        t
                    }))
                });
            }

            for (const grupo of grupos) {
                if (grupo.obligatorio && !gruposElegidos.has(grupo.id)) {
                    throw new ErrorPedido(400, `Elegí ${grupo.nombre} para ${productoBD.nombre}`);
                }
            }

            let extraUnitario = 0;

            for (const item of receta) {
                const base = Number(item.cantidadBase);
                const cantidadFinal = cantidadElegidaPorInsumo.has(item.insumoId)
                    ? cantidadElegidaPorInsumo.get(item.insumoId)
                    : base;

                // En un combo el tamaño agranda solo lo elegido (acompañamiento, bebida); en el resto, toda la receta
                const factor = grupos.length > 0 ? 1 : factorTamanio;
                const cantidadNecesaria = redondear(cantidadFinal * factor * producto.cantidad);
                const extra = Math.max(0, cantidadFinal - base);

                if (extra > 0 && item.Insumo && item.Insumo.precioComercial != null) {
                    extraUnitario += extra * Number(item.Insumo.precioComercial);
                }

                await descontarStock({
                    insumoId: item.insumoId,
                    cantidad: cantidadNecesaria,
                    sucursalId,
                    nombreProducto: productoBD.nombre,
                    pedidoId: nuevoPedido.id,
                    t
                });
            }

            // Stock y recargo de lo elegido en el combo (según el tamaño de cada producto elegido)
            let recargoCombo = 0;
            for (const { elegido, tamanio, recargo, receta: recetaElegido } of elecciones) {
                recargoCombo += recargo;
                for (const item of recetaElegido) {
                    await descontarStock({
                        insumoId: item.insumoId,
                        cantidad: redondear(Number(item.cantidadBase) * Number(tamanio.factorStock ?? 1) * producto.cantidad),
                        sucursalId,
                        nombreProducto: elegido.nombre,
                        pedidoId: nuevoPedido.id,
                        t
                    });
                }
            }

            // Calcular subtotal (precio base + extras agregados + recargos del combo;
            // la personalización de sacar no descuenta)
            const precioUnitario = precioBase + extraUnitario + recargoCombo;
            const subtotal = precioUnitario * producto.cantidad;

            // Acumular al total
            total += subtotal;

            await DetallePedido.create({
                pedidoId: nuevoPedido.id,
                productoId: producto.productoId,
                cantidad: producto.cantidad,
                precio: precioUnitario,
                tamanioId: tamanioElegido ? tamanioElegido.tamanioId : null,
                personalizaciones,
                combo: elecciones.length > 0
                    ? {
                        elecciones: elecciones.map((e) => ({
                            grupoId: e.grupo.id,
                            productoId: e.elegido.id,
                            recargo: e.recargo
                        })),
                        recargo: recargoCombo
                    }
                    : null
            },{transaction: t});
        }

        await nuevoPedido.update({ total: total }, {transaction: t});

        await t.commit();

        return res.status(201).json(nuevoPedido)

    } catch (error){

        await t.rollback();

        if (error instanceof ErrorPedido) {
            return res.status(error.status).json({ mensaje: error.message });
        }

        console.error('Algo salio mal', error.message)

        return res.status(500).json({mensaje: 'Error del servidor'})
    }
};


//const obtenerHistorialPedido = async (req,res) => {};


module.exports = { obtenerPedidos, obtenerPedidoId, crearPedido, obtenerPedidosPorUsuario };