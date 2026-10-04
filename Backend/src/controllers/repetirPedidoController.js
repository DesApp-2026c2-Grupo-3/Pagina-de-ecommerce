const {
    Pedido,
    DetallePedido,
    Producto,
    ProductoTamanio,
    Tamanio,
    RecetaInsumo,
    Insumo,
    ComboGrupo,
    StockSucursal,
    Sucursal,
} = require('../models');
const { productoDisponible, stockComoMapa, pasoExtra } = require('../utils/disponibilidad');

// Igual que en crearPedido y en el front
const EXTRA_MAX_INCREMENTO = 3;

const precio = (n) => `$${n.toLocaleString('es-AR')}`;

// Un producto con todo lo necesario para recalcularlo. Los eliminados no vienen (borrado lógico).
function cargarProducto(id) {
    return Producto.findByPk(id, {
        include: [
            { model: RecetaInsumo, include: [Insumo] },
            { model: ProductoTamanio, as: 'tamanios', include: [Tamanio] },
            { model: ComboGrupo, as: 'grupos' },
        ],
    });
}

// Reconstruye una línea del pedido viejo con el catálogo y los precios de hoy.
// Devuelve { linea } si se puede volver a pedir, o { nombre, motivo } si no.
async function reconstruirLinea(detalle, obtener, stockPorInsumo) {
    const producto = await obtener(detalle.productoId);
    if (!producto) {
        const viejo = await Producto.findByPk(detalle.productoId, { paranoid: false, attributes: ['nombre'] });
        return { nombre: viejo?.nombre ?? 'Un producto', motivo: 'Ya no se vende' };
    }

    const nombre = producto.nombre;
    if (!producto.disponible) return { nombre, motivo: 'No está disponible por el momento' };

    // Tamaño: tiene que seguir existiendo para este producto
    const tamanios = producto.tamanios ?? [];
    let tamanio = null;
    let precioBase = Number(producto.precio);
    if (tamanios.length > 0) {
        tamanio = tamanios.find((t) => t.tamanioId === detalle.tamanioId) ?? null;
        if (!tamanio) return { nombre, motivo: 'Ya no se vende en ese tamaño' };
        precioBase = Number(tamanio.precio);
    }

    // Personalización: solo lo que la receta de hoy sigue permitiendo, con los precios de hoy
    const receta = producto.RecetaInsumos ?? [];
    const porInsumo = new Map(receta.map((r) => [r.insumoId, r]));
    const viejas = Array.isArray(detalle.personalizaciones) ? detalle.personalizaciones : [];
    const personalizaciones = [];
    const textosPersonalizacion = [];
    let extraUnitario = 0;

    for (const p of viejas) {
        const item = porInsumo.get(Number(p.insumoId));
        if (!item) continue;
        const base = Number(item.cantidadBase);
        const cantidad = Number(p.cantidad);
        if (cantidad === base) continue;
        if (cantidad < base && !item.esRemovible) continue;
        if (cantidad > base && (!item.esAgregable || cantidad - base > EXTRA_MAX_INCREMENTO * pasoExtra(base))) continue;

        const nombreInsumo = item.Insumo?.nombre ?? 'Ingrediente';
        personalizaciones.push({ insumoId: item.insumoId, cantidad });
        extraUnitario += Math.max(0, cantidad - base) * Number(item.Insumo?.precioComercial ?? 0);
        textosPersonalizacion.push(
            cantidad === 0
                ? `Sin ${nombreInsumo}`
                : cantidad > base
                    ? `${cantidad - base} ${nombreInsumo} extra`
                    : `${nombreInsumo} x${cantidad}`
        );
    }

    // Combo: cada lugar tiene que seguir existiendo, y la opción elegida, valer en ese tamaño
    const grupos = [...(producto.grupos ?? [])].sort((a, b) => a.orden - b.orden);
    const eleccionesViejas = detalle.combo?.elecciones ?? [];
    const combo = [];
    const textosCombo = [];
    let recargoCombo = 0;

    for (const grupo of grupos) {
        const vieja = eleccionesViejas.find((e) => e.grupoId === grupo.id);
        if (!vieja) {
            if (grupo.obligatorio) return { nombre, motivo: 'El combo cambió: armalo de nuevo' };
            continue;
        }

        const elegido = await obtener(vieja.productoId);
        if (!elegido || !elegido.disponible || elegido.categoriaId !== grupo.categoriaId) {
            return { nombre, motivo: `${elegido?.nombre ?? 'Una opción del combo'} ya no está disponible` };
        }

        const tamanioElegido = (elegido.tamanios ?? []).find((t) => t.tamanioId === detalle.tamanioId);
        if (!tamanioElegido) return { nombre, motivo: `${elegido.nombre} ya no se vende en ese tamaño` };

        if (stockPorInsumo && !productoDisponible(elegido, elegido.RecetaInsumos, stockPorInsumo, Number(tamanioElegido.factorStock ?? 1))) {
            return { nombre, motivo: `No hay stock de ${elegido.nombre} en tu sucursal` };
        }

        // El recargo se calcula con los precios de hoy, contra la opción incluida
        let recargo = 0;
        if (elegido.id !== grupo.productoIncluidoId) {
            const incluido = await obtener(grupo.productoIncluidoId);
            const tamanioIncluido = (incluido?.tamanios ?? []).find((t) => t.tamanioId === detalle.tamanioId);
            if (tamanioIncluido) recargo = Math.max(0, Number(tamanioElegido.precio) - Number(tamanioIncluido.precio));
        }

        recargoCombo += recargo;
        combo.push({ grupoId: grupo.id, productoId: elegido.id });
        textosCombo.push(`${elegido.nombre}${recargo > 0 ? ` (+${precio(recargo)})` : ''}`);
    }

    // Stock del producto en la sucursal (un combo no agranda su receta, igual que en crearPedido)
    if (stockPorInsumo) {
        const factor = grupos.length > 0 ? 1 : Number(tamanio?.factorStock ?? 1);
        if (!productoDisponible(producto, receta, stockPorInsumo, factor)) {
            return { nombre, motivo: 'No hay stock en tu sucursal' };
        }
    }

    return {
        linea: {
            productoId: producto.id,
            cantidad: detalle.cantidad,
            tamanioId: tamanio ? tamanio.tamanioId : null,
            personalizaciones,
            combo,
            unitPrice: precioBase + extraUnitario + recargoCombo,
            precioAnterior: Number(detalle.precio),
            // El mismo orden de textos que arma el detalle del producto: primero el combo, después la personalización
            selectedOptions: [...textosCombo, ...textosPersonalizacion],
            aviso: personalizaciones.length < viejas.length
                ? `En ${nombre}, algunos cambios ya no se pueden pedir`
                : null,
        },
    };
}

// GET /pedido/:id/repetir?usuarioId=X&sucursalId=Y
// → { disponibles: [líneas listas para el carrito], noDisponibles: [{ nombre, cantidad, motivo }] }
const repetirPedido = async (req, res) => {
    try {
        const usuarioId = Number(req.query.usuarioId);
        const sucursalId = Number(req.query.sucursalId) || null;

        const pedido = await Pedido.findByPk(req.params.id, { include: [DetallePedido] });
        if (!pedido || pedido.usuarioId !== usuarioId) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }

        // Stock de la sucursal de la zona del cliente (si viene y está activa)
        let stockPorInsumo = null;
        if (sucursalId) {
            const sucursal = await Sucursal.findByPk(sucursalId);
            if (sucursal?.activa) {
                const stock = await StockSucursal.findAll({ where: { sucursalId }, attributes: ['insumoId', 'cantidad'] });
                stockPorInsumo = stockComoMapa(stock);
            }
        }

        // Cada producto se busca una sola vez, aunque aparezca en varias líneas o combos
        const cache = new Map();
        const obtener = async (id) => {
            if (!cache.has(id)) cache.set(id, await cargarProducto(id));
            return cache.get(id);
        };

        const disponibles = [];
        const noDisponibles = [];
        for (const detalle of pedido.DetallePedidos) {
            const resultado = await reconstruirLinea(detalle, obtener, stockPorInsumo);
            if (resultado.linea) {
                disponibles.push(resultado.linea);
            } else {
                noDisponibles.push({ nombre: resultado.nombre, cantidad: detalle.cantidad, motivo: resultado.motivo });
            }
        }

        res.json({ disponibles, noDisponibles });
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'No se pudo repetir el pedido' });
    }
};

module.exports = { repetirPedido };