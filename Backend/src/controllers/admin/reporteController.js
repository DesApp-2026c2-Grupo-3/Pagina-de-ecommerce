const { Pedido, DetallePedido,Producto,Categoria,Admin,Sucursal,StockSucursal,    
    RecetaInsumo,ProductoTamanio,ComboGrupo,Insumo,sequelize,historialDeTiemposPedido,Usuario,Promocion
} = require('../../models');

const { Op } = require('sequelize');

/* =========================================================
   PERÍODO DE LOS BOTONES "7 días · 30 días · 12 meses · Histórico"
   Llega como ?ultimos=7, 30 o 365 (sin "ultimos": todo el historial).
   Devuelve { fecha } con la condición lista para el where
   (null = sin filtro), o { error } si el valor no es válido.
   ========================================================= */
const DIAS_DEL_PERIODO = [7, 30, 365];

const obtenerPeriodo = (query) => {
    if (query.ultimos === undefined) return { fecha: null };

    const dias = Number(query.ultimos);
    if (!DIAS_DEL_PERIODO.includes(dias)) {
        return { error: 'El período no es válido' };
    }

    // Desde el comienzo del día, hace "dias - 1" días (hoy incluido)
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - (dias - 1));

    return { fecha: { [Op.gte]: desde } };
};

const obtenerProductosMasVendidos = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const wherePedido = {
            estado: { [Op.iLike]: 'entregado' },
        };

        // El administrador de sucursal solo puede consultar la suya.
        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({ mensaje: 'La sucursal no es válida' });
            }

            wherePedido.sucursalId = sucursalId;
        }

        // Período de los botones (sin "ultimos": todo el historial)
        const periodo = obtenerPeriodo(req.query);
        if (periodo.error) return res.status(400).json({ mensaje: periodo.error });
        if (periodo.fecha) wherePedido.fecha = periodo.fecha;

        const productos = await DetallePedido.findAll({
            attributes: [
                'productoId',
                [sequelize.fn('SUM', sequelize.col('DetallePedido.cantidad')), 'unidadesVendidas'],
            ],
            include: [
                {
                    model: Pedido,
                    attributes: [],
                    where: wherePedido,
                    required: true,
                },
                {
                    model: Producto,
                    attributes: ['nombre', 'imagen'],
                    paranoid: false,
                    required: true,
                    // Traemos el nombre de la categoría para elegir el ícono
                    include: [
                        {
                            model: Categoria,
                            as: 'categoria',
                            attributes: ['nombre'],
                            required: false, // si un producto no tiene categoría, igual aparece
                        },
                    ],
                },
            ],
            group: [
                'DetallePedido.productoId',
                'Producto.id',
                // PostgreSQL exige agrupar también por la categoría
                'Producto->categoria.id',
            ],
            order: [[sequelize.literal('"unidadesVendidas"'), 'DESC']],
        });

        return res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos más vendidos:', error);
        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de productos más vendidos',
        });
    }
};

const obtenerProductosMenosVendidos = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        const wherePedido = {
            estado: { [Op.iLike]: 'entregado' },
        };

        // Un administrador común solo consulta su sucursal.
        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({
                    mensaje: 'La sucursal no es válida',
                });
            }

            wherePedido.sucursalId = sucursalId;
        }

        // Período de los botones (sin "ultimos": todo el historial)
        const periodo = obtenerPeriodo(req.query);
        if (periodo.error) return res.status(400).json({ mensaje: periodo.error });
        if (periodo.fecha) wherePedido.fecha = periodo.fecha;

        const productos = await Producto.findAll({
            attributes: [
                'id',
                'nombre',
                'imagen',
                [
                    sequelize.fn(
                        'COALESCE',
                        sequelize.fn(
                            'SUM',
                            sequelize.col('DetallePedidos.cantidad'),
                        ),
                        0,
                    ),
                    'unidadesVendidas',
                ],
            ],
            include: [
                // Traemos el nombre de la categoría para elegir el ícono
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['nombre'],
                    required: false,
                },
                {
                    model: DetallePedido,
                    attributes: [],
                    required: false,
                    include: [
                        {
                            model: Pedido,
                            attributes: [],
                            where: wherePedido,
                            required: true,
                        },
                    ],
                },
            ],
            // PostgreSQL exige agrupar también por la categoría
            group: ['Producto.id', 'categoria.id'],            
            order: [
                [sequelize.literal('"unidadesVendidas"'), 'ASC'],
                ['nombre', 'ASC'],
            ],
        });

        return res.json(
            productos.map((producto) => ({
                productoId: producto.id,
                nombre: producto.nombre,
                        imagen: producto.imagen,
                categoria: producto.categoria
                    ? { nombre: producto.categoria.nombre }
                    : null,
                unidadesVendidas: producto.get('unidadesVendidas'),
            })),
        );
    } catch (error) {
        console.error('Error al obtener productos menos vendidos:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de productos menos vendidos',
        });
    }
};

const obtenerProductosMayorFacturacion = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        const wherePedido = {
            estado: { [Op.iLike]: 'entregado' },
        };

        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({
                    mensaje: 'La sucursal no es válida',
                });
            }

            wherePedido.sucursalId = sucursalId;
        }

        // Período de los botones (sin "ultimos": todo el historial)
        const periodo = obtenerPeriodo(req.query);
        if (periodo.error) return res.status(400).json({ mensaje: periodo.error });
        if (periodo.fecha) wherePedido.fecha = periodo.fecha;

        const productos = await DetallePedido.findAll({
            attributes: [
                'productoId',
                [
                    sequelize.literal(
                        'SUM("DetallePedido"."cantidad" * "DetallePedido"."precio")',
                    ),
                    'facturacion',
                ],
            ],
            include: [
                {
                    model: Pedido,
                    attributes: [],
                    where: wherePedido,
                    required: true,
                },
                {
                    model: Producto,
                    attributes: ['nombre', 'imagen'],
                    paranoid: false,
                    required: true,
                    // Traemos el nombre de la categoría para elegir el ícono
                    include: [
                        {
                            model: Categoria,
                            as: 'categoria',
                            attributes: ['nombre'],
                            required: false,
                        },
                    ],
                },
            ],
            // PostgreSQL exige agrupar también por la categoría
            group: ['DetallePedido.productoId', 'Producto.id', 'Producto->categoria.id'],
            order: [
                [sequelize.literal('"facturacion"'), 'DESC'],
            ],
        });

        return res.json(
            productos.map((producto) => ({
                productoId: producto.productoId,
                nombre: producto.Producto.nombre,
                imagen: producto.Producto.imagen,
                categoria: producto.Producto.categoria
                    ? { nombre: producto.Producto.categoria.nombre }
                    : null,
                facturacion: producto.get('facturacion'),
            })),
        );
    } catch (error) {
        console.error('Error al obtener productos con mayor facturación:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de facturación',
        });
    }
};

const obtenerProductosSinStock = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        const whereSucursal = { activa: true };

        // El administrador de sucursal solo consulta la propia.
        if (admin.sucursalId !== null) {
            whereSucursal.id = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({
                    mensaje: 'La sucursal no es válida',
                });
            }

            whereSucursal.id = sucursalId;
        }

        const sucursales = await Sucursal.findAll({
            where: whereSucursal,
            attributes: ['id', 'nombre'],
            order: [['nombre', 'ASC']],
        });

       const productos = await Producto.findAll({
        where: { disponible: true },
        attributes: ['id', 'nombre', 'imagen', 'categoriaId'],
        order: [['nombre', 'ASC']],
        });

        const productoIds = productos.map((producto) => producto.id);
        const sucursalIds = sucursales.map((sucursal) => sucursal.id);

        const [recetas, tamanios, grupos, stock] = await Promise.all([
            RecetaInsumo.findAll({
                where: { productoId: productoIds },
            }),
            ProductoTamanio.findAll({
                where: { productoId: productoIds },
            }),
            ComboGrupo.findAll({
                where: { productoId: productoIds },
            }),
            StockSucursal.findAll({
                where: { sucursalId: sucursalIds },
            }),
        ]);

        const insumos = await Insumo.findAll({
    attributes: ['id', 'nombre'],
});

const nombreInsumo = new Map(
    insumos.map((insumo) => [insumo.id, insumo.nombre]),
);

const stockPorSucursal = new Map();

for (const registro of stock) {
    stockPorSucursal.set(
        `${registro.sucursalId}-${registro.insumoId}`,
        Number(registro.cantidad),
    );
}

const recetasPorProducto = new Map();

for (const receta of recetas) {
    const lista = recetasPorProducto.get(receta.productoId) ?? [];
    lista.push(receta);
    recetasPorProducto.set(receta.productoId, lista);
}

const gruposPorProducto = new Map();

for (const grupo of grupos) {
    const lista = gruposPorProducto.get(grupo.productoId) ?? [];
    lista.push(grupo);
    gruposPorProducto.set(grupo.productoId, lista);
}

const productosSinStock = [];

for (const sucursal of sucursales) {
    for (const producto of productos) {
        const gruposProducto = gruposPorProducto.get(producto.id) ?? [];

        // Los combos se evaluarán en un paso separado.
        if (gruposProducto.length > 0) {
            continue;
        }

        const recetaProducto = (
            recetasPorProducto.get(producto.id) ?? []
        ).filter((item) => Number(item.cantidadBase) > 0);

        // Sin receta no podemos determinar agotamiento por ingredientes.
        if (recetaProducto.length === 0) {
            continue;
        }

        const tamaniosProducto = tamanios.filter(
            (tamanio) => tamanio.productoId === producto.id,
        );

        const factor = tamaniosProducto.length > 0
            ? Math.min(
                ...tamaniosProducto.map((tamanio) =>
                    Number(tamanio.factorStock ?? 1),
                ),
            )
            : 1;

        let insumoLimitante = null;
        let unidadesDisponibles = Infinity;

        for (const item of recetaProducto) {
            const cantidadNecesaria = Number(item.cantidadBase) * factor;

            const cantidadStock = stockPorSucursal.get(
                `${sucursal.id}-${item.insumoId}`,
            ) ?? 0;

            const unidadesPosibles = Math.floor(
                cantidadStock / cantidadNecesaria,
            );

            if (unidadesPosibles < unidadesDisponibles) {
                unidadesDisponibles = unidadesPosibles;
                insumoLimitante = nombreInsumo.get(item.insumoId) ?? 'Ingrediente desconocido';
            }
        }

        if (unidadesDisponibles === 0) {
            productosSinStock.push({
                productoId: producto.id,
                nombre: producto.nombre,
                imagen: producto.imagen,
                sucursalId: sucursal.id,
                sucursalNombre: sucursal.nombre,
                unidadesDisponibles: 0,
                insumoLimitante,
            });
             }
    }
}


for (const sucursal of sucursales) {
    for (const combo of productos) {
        const gruposCombo = gruposPorProducto.get(combo.id) ?? [];

        // Solo evaluamos productos que tengan grupos de combo.
        if (gruposCombo.length === 0) {
            continue;
        }

        // La receta propia del combo consume stock con factor 1.
        const recetaCombo = (
            recetasPorProducto.get(combo.id) ?? []
        ).filter((item) => Number(item.cantidadBase) > 0);

        const ingredienteFaltante = recetaCombo.find((item) => {
            const disponible = stockPorSucursal.get(
                `${sucursal.id}-${item.insumoId}`,
            ) ?? 0;

            return disponible < Number(item.cantidadBase);
        });

        if (ingredienteFaltante) {
            productosSinStock.push({
                productoId: combo.id,
                nombre: combo.nombre,
                imagen: combo.imagen,
                sucursalId: sucursal.id,
                sucursalNombre: sucursal.nombre,
                unidadesDisponibles: 0,
                insumoLimitante:
                    nombreInsumo.get(ingredienteFaltante.insumoId) ??
                    'Ingrediente desconocido',
            });

            continue;
        }

        // Un combo está agotado si algún grupo obligatorio
        // no tiene ninguna opción que pueda prepararse.
        let grupoSinOpciones = null;

        for (const grupo of gruposCombo) {
            if (!grupo.obligatorio) {
                continue;
            }

            const opciones = productos.filter(
                (opcion) =>
                    opcion.categoriaId === grupo.categoriaId &&
                    opcion.id !== combo.id,
            );

            let hayOpcionDisponible = false;

            for (const opcion of opciones) {
                const tieneTamanioValido = tamanios.some(
                    (tamanio) =>
                        tamanio.productoId === opcion.id &&
                        tamanios.some(
                            (tamanioCombo) =>
                                tamanioCombo.productoId === combo.id &&
                                Number(tamanioCombo.tamanioId) ===
                                    Number(tamanio.tamanioId),
                        ),
                );

                if (!tieneTamanioValido) {
                    continue;
                }

                if (
                    puedePrepararse(
                        opcion,
                        sucursal.id,
                        recetasPorProducto,
                        tamanios,
                        stockPorSucursal,
                        tamanios.find(
                            (tamanio) =>
                                tamanio.productoId === combo.id,
                        )?.tamanioId,
                    )
                ) {
                    hayOpcionDisponible = true;
                    break;
                }
            }

            if (!hayOpcionDisponible) {
                grupoSinOpciones = grupo.nombre;
                break;
            }
        }

        if (grupoSinOpciones) {
            productosSinStock.push({
                productoId: combo.id,
                nombre: combo.nombre,
                imagen: combo.imagen,
                sucursalId: sucursal.id,
                sucursalNombre: sucursal.nombre,
                unidadesDisponibles: 0,
                insumoLimitante: `Sin opciones disponibles: ${grupoSinOpciones}`,
            });
        }
    }
}


return res.json(productosSinStock);

    } catch (error) {
        console.error('Error al obtener productos sin stock:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de productos sin stock',
        });
    }
};

function puedePrepararse(
    producto,
    sucursalId,
    recetasPorProducto,
    tamanios,
    stockPorSucursal,
    tamanioId = null,
) {
    const receta = (recetasPorProducto.get(producto.id) ?? [])
        .filter((item) => Number(item.cantidadBase) > 0);

    if (receta.length === 0) {
        return true;
    }

    const tamaniosProducto = tamanios.filter(
        (tamanio) => tamanio.productoId === producto.id,
    );

    let factor = 1;

    if (tamanioId !== null) {
        const tamanioElegido = tamaniosProducto.find(
            (tamanio) => Number(tamanio.tamanioId) === Number(tamanioId),
        );

        if (!tamanioElegido) {
            return false;
        }

        factor = Number(tamanioElegido.factorStock ?? 1);
    } else if (tamaniosProducto.length > 0) {
        factor = Math.min(
            ...tamaniosProducto.map(
                (tamanio) => Number(tamanio.factorStock ?? 1),
            ),
        );
    }

    return receta.every((item) => {
        const necesario = Number(item.cantidadBase) * factor;
        const disponible = stockPorSucursal.get(
            `${sucursalId}-${item.insumoId}`,
        ) ?? 0;

        return disponible >= necesario;
    });
}


const obtenerPedidosPorEstado = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        const wherePedido = {};

        // El administrador de sucursal solo consulta la propia.
        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({
                    mensaje: 'La sucursal no es válida',
                });
            }

            wherePedido.sucursalId = sucursalId;
        }

        const estadosPosibles = [
            'pendiente',
            'en proceso',
            'en camino',
            'entregado',
            'cancelado',
        ];

        const estadoNormalizado = sequelize.fn(
            'LOWER',
            sequelize.fn('TRIM', sequelize.col('estado')),
        );

        const pedidos = await Pedido.findAll({
            attributes: [
                [estadoNormalizado,'estado'],
                [
                    sequelize.fn('COUNT', sequelize.col('id')),
                    'cantidad',
                ],
            ],
            where: wherePedido,
            group: [estadoNormalizado],
            order: [[estadoNormalizado, 'ASC']],
        });

        const cantidadesPorEstado = new Map(
            pedidos.map((pedido) => [
                pedido.get('estado'),
                Number(pedido.get('cantidad')),
            ]),
        );

        return res.json(
            estadosPosibles.map((estado) => ({
                estado,
                cantidad: cantidadesPorEstado.get(estado) ?? 0,
            })),
        );
    } catch (error) {
        console.error('Error al obtener pedidos por estado:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de pedidos por estado',
        });
    }
};


const obtenerPedidosPorDia = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        const wherePedido = {};

        // El administrador de sucursal solo consulta la propia.
        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({
                    mensaje: 'La sucursal no es válida',
                });
            }

            wherePedido.sucursalId = sucursalId;
        }

        const fechaAgrupada = sequelize.fn(
            'DATE_TRUNC',
            'day',
            sequelize.col('fecha'),
        );

        const pedidos = await Pedido.findAll({
            attributes: [
                [fechaAgrupada, 'fecha'],
                [
                    sequelize.fn('COUNT', sequelize.col('id')),
                    'cantidad',
                ],
            ],
            where: wherePedido,
            group: [fechaAgrupada],
            order: [[fechaAgrupada, 'ASC']],
        });

        return res.json(
            pedidos.map((pedido) => ({
                fecha: pedido.get('fecha'),
                cantidad: Number(pedido.get('cantidad')),
            })),
        );
    } catch (error) {
        console.error('Error al obtener pedidos por día:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de pedidos por día',
        });
    }
};


const obtenerPedidosPorSucursal = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        const wherePedido = {};

        // El administrador de sucursal solo consulta la propia.
        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        }

        // Período de los botones (sin "ultimos": todo el historial)
        const periodo = obtenerPeriodo(req.query);
        if (periodo.error) return res.status(400).json({ mensaje: periodo.error });
        if (periodo.fecha) wherePedido.fecha = periodo.fecha;

        const pedidos = await Pedido.findAll({
            attributes: [
                'sucursalId',
                [
                    sequelize.fn('COUNT', sequelize.col('Pedido.id')),
                    'cantidad',
                ],
            ],
            where: wherePedido,
            include: [
                {
                    model: Sucursal,
                    attributes: ['nombre'],
                    required: true,
                    where: { activa: true },
                },
            ],
            group: ['Pedido.sucursalId', 'Sucursal.id'],
            order: [
                [sequelize.literal('"cantidad"'), 'DESC'],
            ],
        });

        return res.json(
            pedidos.map((pedido) => ({
                sucursalId: pedido.sucursalId,
                nombre: pedido.Sucursal.nombre,
                cantidad: Number(pedido.get('cantidad')),
            })),
        );
    } catch (error) {
        console.error('Error al obtener pedidos por sucursal:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de pedidos por sucursal',
        });
    }
};

const obtenerCancelacionesPorDia = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        const wherePedido = {};

        // El administrador de sucursal solo consulta la propia.
        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({
                    mensaje: 'La sucursal no es válida',
                });
            }

            wherePedido.sucursalId = sucursalId;
        }

        // Últimos 30 días, incluyendo hoy.
        const fechaInicio = new Date();
        fechaInicio.setHours(0, 0, 0, 0);
        fechaInicio.setDate(fechaInicio.getDate() - 29);

        const fechaAgrupada = sequelize.fn(
            'DATE_TRUNC',
            'day',
            sequelize.col('historialDeTiemposPedido.fecha'),
        );

        const cancelaciones = await historialDeTiemposPedido.findAll({
            attributes: [
                [fechaAgrupada, 'fecha'],
                [
                    sequelize.fn(
                        'COUNT',
                        sequelize.col('historialDeTiemposPedido.id'),
                    ),
                    'cantidad',
                ],
            ],
            where: {
                estado: {
                    [Op.iLike]: 'cancelado',
                },
                fecha: {
                    [Op.gte]: fechaInicio,
                },
            },
            include: [
                {
                    model: Pedido,
                    attributes: [],
                    required: true,
                    where: wherePedido,
                },
            ],
            group: [fechaAgrupada],
            order: [[fechaAgrupada, 'ASC']],
        });

        return res.json(
            cancelaciones.map((cancelacion) => ({
                fecha: cancelacion.get('fecha'),
                cantidad: Number(cancelacion.get('cantidad')),
            })),
        );
    } catch (error) {
        console.error('Error al obtener cancelaciones por día:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de cancelaciones por día',
        });
    }
};


const obtenerTiempoPromedioEntrega = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        const wherePedido = {};

        // El administrador de sucursal solo consulta la propia.
        if (admin.sucursalId !== null) {
            wherePedido.sucursalId = admin.sucursalId;
        } else if (req.query.sucursalId !== undefined) {
            const sucursalId = Number(req.query.sucursalId);

            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return res.status(400).json({
                    mensaje: 'La sucursal no es válida',
                });
            }

            wherePedido.sucursalId = sucursalId;
        }

        // Buscar las fechas de entrega de los pedidos entregados.
        const entregas = await historialDeTiemposPedido.findAll({
            attributes: [
                'pedidoId',
                [sequelize.col('Pedido.fecha'), 'fechaCreacion'],
                'fecha',
            ],
            where: {
                estado: {
                    [Op.iLike]: 'entregado',
                },
            },
            include: [
                {
                    model: Pedido,
                    attributes: [],
                    required: true,
                    where: wherePedido,
                },
            ],
            raw: true,
        });

        // Cada pedido aporta su duración total en minutos.
        const tiempos = entregas
            .map((entrega) => {
                const inicio = new Date(entrega.fechaCreacion).getTime();
                const fin = new Date(entrega.fecha).getTime();

                return (fin - inicio) / 60000;
            })
            .filter((minutos) => Number.isFinite(minutos) && minutos >= 0);

        const cantidad = tiempos.length;

        const promedioMinutos = cantidad > 0
            ? tiempos.reduce((total, minutos) => total + minutos, 0) / cantidad
            : null;

        return res.json({
            cantidadPedidos: cantidad,
            promedioMinutos:
                promedioMinutos === null
                    ? null
                    : Math.round(promedioMinutos * 100) / 100,
        });
    } catch (error) {
        console.error('Error al obtener el tiempo promedio de entrega:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el tiempo promedio de entrega',
        });
    }
};
/* =========================================================
   REPORTES DE CLIENTES
   Se cuentan solo los pedidos entregados.
   ========================================================= */

// Sucursal a consultar: la del admin de sucursal, o la que eligió el MASTER.
// Devuelve { sucursalId } (undefined = todas) o { error } si el filtro no es válido.
const obtenerSucursalDelFiltro = (admin, query) => {
    if (admin.sucursalId !== null) {
        return { sucursalId: admin.sucursalId };
    }

    if (query.sucursalId === undefined) {
        return { sucursalId: undefined };
    }

    const sucursalId = Number(query.sucursalId);

    if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
        return { error: 'La sucursal no es válida' };
    }

    return { sucursalId };
};

// Pedidos entregados con su cliente y su sucursal, del más viejo al más nuevo.
const buscarPedidosEntregados = (sucursalId, fecha = null) => {
    const where = {
        estado: { [Op.iLike]: 'entregado' },
        usuarioId: { [Op.ne]: null },
    };

    if (sucursalId !== undefined) where.sucursalId = sucursalId;
    if (fecha) where.fecha = fecha;

    return Pedido.findAll({
        attributes: ['id', 'usuarioId', 'fecha', 'total', 'sucursalId'],
        where,
        include: [
            { model: Usuario, attributes: ['id', 'nombre', 'apellido', 'email', 'createdAt'] },
            { model: Sucursal, attributes: ['id', 'nombre'] },
        ],
        order: [['fecha', 'ASC']],
    });
};

// Agrupa los pedidos por cliente: cantidad, gasto, primer y último pedido,
// y en qué sucursales pidió.
const agruparPorCliente = (pedidos) => {
    const clientes = new Map();

    pedidos.forEach((pedido) => {
        const usuario = pedido.Usuario;
        if (!usuario) return;

        if (!clientes.has(usuario.id)) {
            clientes.set(usuario.id, {
                usuario,
                pedidoIds: [],
                cantidadPedidos: 0,
                totalGastado: 0,
                primerPedido: pedido.fecha,
                ultimoPedido: pedido.fecha,
                ultimaSucursal: null,
                sucursales: new Map(),
            });
        }

        const cliente = clientes.get(usuario.id);
        const nombreSucursal = pedido.Sucursal?.nombre ?? null;

        cliente.pedidoIds.push(pedido.id);
        cliente.cantidadPedidos += 1;
        cliente.totalGastado += Number(pedido.total);
        cliente.ultimoPedido = pedido.fecha;
        cliente.ultimaSucursal = nombreSucursal;

        if (nombreSucursal) {
            cliente.sucursales.set(
                nombreSucursal,
                (cliente.sucursales.get(nombreSucursal) ?? 0) + 1,
            );
        }
    });

    return [...clientes.values()];
};

// La clave con el valor más alto de un Map (o null si está vacío).
const elMasRepetido = (conteo) => {
    let ganador = null;
    let maximo = 0;

    conteo.forEach((cantidad, clave) => {
        if (cantidad > maximo) {
            ganador = clave;
            maximo = cantidad;
        }
    });

    return ganador;
};

// Producto que más unidades pidió cada cliente: Map(usuarioId -> nombre).
const buscarProductosFavoritos = async (clientes) => {
    const duenioDelPedido = new Map();

    clientes.forEach((cliente) => {
        cliente.pedidoIds.forEach((pedidoId) => {
            duenioDelPedido.set(pedidoId, cliente.usuario.id);
        });
    });

    if (duenioDelPedido.size === 0) return new Map();

    const detalles = await DetallePedido.findAll({
        attributes: ['pedidoId', 'productoId', 'cantidad'],
        where: { pedidoId: [...duenioDelPedido.keys()] },
        // paranoid: false → también los productos eliminados (borrado lógico): el historial no cambia
        include: [{ model: Producto, attributes: ['id', 'nombre'], paranoid: false }],    
    });

    const unidadesPorCliente = new Map();

    detalles.forEach((detalle) => {
        const usuarioId = duenioDelPedido.get(detalle.pedidoId);
        const nombre = detalle.Producto?.nombre;
        if (usuarioId === undefined || !nombre) return;

        if (!unidadesPorCliente.has(usuarioId)) {
            unidadesPorCliente.set(usuarioId, new Map());
        }

        const unidades = unidadesPorCliente.get(usuarioId);
        unidades.set(nombre, (unidades.get(nombre) ?? 0) + Number(detalle.cantidad));
    });

    const favoritos = new Map();
    unidadesPorCliente.forEach((unidades, usuarioId) => {
        favoritos.set(usuarioId, elMasRepetido(unidades));
    });

    return favoritos;
};

const LIMITE_CLIENTES = 10;

const obtenerClientesMasPedidos = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const filtro = obtenerSucursalDelFiltro(admin, req.query);
        if (filtro.error) {
            return res.status(400).json({ mensaje: filtro.error });
        }

        // Período de los botones (sin "ultimos": todo el historial)
        const periodo = obtenerPeriodo(req.query);
        if (periodo.error) return res.status(400).json({ mensaje: periodo.error });

        const pedidos = await buscarPedidosEntregados(filtro.sucursalId, periodo.fecha);

        const ranking = agruparPorCliente(pedidos)
            .sort((a, b) => b.cantidadPedidos - a.cantidadPedidos || b.totalGastado - a.totalGastado)
            .slice(0, LIMITE_CLIENTES);

        const favoritos = await buscarProductosFavoritos(ranking);

        return res.json(
            ranking.map((cliente) => ({
                usuarioId: cliente.usuario.id,
                nombre: cliente.usuario.nombre,
                apellido: cliente.usuario.apellido,
                email: cliente.usuario.email,
                clienteDesde: cliente.usuario.createdAt,
                cantidadPedidos: cliente.cantidadPedidos,
                totalGastado: cliente.totalGastado,
                ultimoPedido: cliente.ultimoPedido,
                sucursalFavorita: elMasRepetido(cliente.sucursales),
                productoFavorito: favoritos.get(cliente.usuario.id) ?? null,
            })),
        );
    } catch (error) {
        console.error('Error al obtener clientes con más pedidos:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de clientes con más pedidos',
        });
    }
};

const PERIODOS_CLIENTES = { mes: 6, semana: 8 };

// Fecha "AAAA-MM-DD" con la hora local
const claveDeFecha = (fecha) => {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
};

// Primer día del período (mes) o lunes de la semana de una fecha
const inicioDelPeriodo = (fecha, periodo) => {
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);

    if (periodo === 'mes') {
        inicio.setDate(1);
    } else {
        inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    }

    return inicio;
};

const obtenerClientesNuevos = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const filtro = obtenerSucursalDelFiltro(admin, req.query);
        if (filtro.error) {
            return res.status(400).json({ mensaje: filtro.error });
        }

        const periodo = req.query.periodo ?? 'mes';
        if (!PERIODOS_CLIENTES[periodo]) {
            return res.status(400).json({ mensaje: 'El período no es válido' });
        }

        // Los últimos N períodos, del más viejo al actual, empezando en 0
        const cantidadPeriodos = PERIODOS_CLIENTES[periodo];
        const actual = inicioDelPeriodo(new Date(), periodo);
        const periodos = [];

        for (let i = cantidadPeriodos - 1; i >= 0; i--) {
            const inicio = new Date(actual);
            if (periodo === 'mes') inicio.setMonth(inicio.getMonth() - i);
            else inicio.setDate(inicio.getDate() - i * 7);
            periodos.push({ inicio: claveDeFecha(inicio), cantidad: 0 });
        }

        // Un cliente es "nuevo" en el período de su primer pedido entregado
        // (en la sucursal elegida, si hay filtro). Por eso se buscan todos los
        // pedidos y no solo los de los últimos períodos.
        const pedidos = await buscarPedidosEntregados(filtro.sucursalId, null);
        const porPeriodo = new Map(periodos.map((item) => [item.inicio, item]));

        agruparPorCliente(pedidos).forEach((cliente) => {
            const clave = claveDeFecha(inicioDelPeriodo(new Date(cliente.primerPedido), periodo));
            const item = porPeriodo.get(clave);
            if (item) item.cantidad += 1;
        });

        return res.json(periodos);
    } catch (error) {
        console.error('Error al obtener clientes nuevos:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de clientes nuevos',
        });
    }
};

const DIA_EN_MS = 24 * 60 * 60 * 1000;
const LIMITE_INACTIVOS = 50;

const obtenerClientesInactivos = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const filtro = obtenerSucursalDelFiltro(admin, req.query);
        if (filtro.error) {
            return res.status(400).json({ mensaje: filtro.error });
        }

        const dias = Number(req.query.dias ?? 60);
        if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
            return res.status(400).json({ mensaje: 'La cantidad de días no es válida' });
        }

        const ahora = Date.now();
        const pedidos = await buscarPedidosEntregados(filtro.sucursalId, null);

        const inactivos = agruparPorCliente(pedidos)
            .map((cliente) => ({
                ...cliente,
                diasSinPedir: Math.floor((ahora - new Date(cliente.ultimoPedido).getTime()) / DIA_EN_MS),
            }))
            .filter((cliente) => cliente.diasSinPedir >= dias)
            .sort((a, b) => b.diasSinPedir - a.diasSinPedir)
            .slice(0, LIMITE_INACTIVOS);

        const favoritos = await buscarProductosFavoritos(inactivos);

        return res.json(
            inactivos.map((cliente) => ({
                usuarioId: cliente.usuario.id,
                nombre: cliente.usuario.nombre,
                apellido: cliente.usuario.apellido,
                email: cliente.usuario.email,
                ultimoPedido: cliente.ultimoPedido,
                diasSinPedir: cliente.diasSinPedir,
                cantidadPedidos: cliente.cantidadPedidos,
                sucursal: cliente.ultimaSucursal,
                productoFavorito: favoritos.get(cliente.usuario.id) ?? null,
            })),
        );
    } catch (error) {
        console.error('Error al obtener clientes inactivos:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de clientes inactivos',
        });
    }
};

/* =========================================================
   REPORTES DE SUCURSALES
   Comparan las sucursales entre sí. El admin de sucursal
   solo recibe la suya. Se cuentan solo los pedidos entregados.
   ========================================================= */

// Primer día de un mes (desplazado "meses" desde el mes de "fecha")
const inicioDeMes = (fecha, meses = 0) =>
    new Date(fecha.getFullYear(), fecha.getMonth() + meses, 1);

const obtenerVentasPorSucursal = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        // "anterior": el último mes completo contra el mes de antes.
        // "actual": el mes en curso contra el mes anterior completo.
        const mes = req.query.mes ?? 'anterior';
        if (!['anterior', 'actual'].includes(mes)) {
            return res.status(400).json({ mensaje: 'El mes no es válido' });
        }

        const hoy = new Date();
        const desplazamiento = mes === 'actual' ? 0 : -1;
        const inicioMes = inicioDeMes(hoy, desplazamiento);
        const finMes = inicioDeMes(hoy, desplazamiento + 1);
        const inicioMeta = inicioDeMes(hoy, desplazamiento - 1);

        const wherePedido = {
            estado: { [Op.iLike]: 'entregado' },
            fecha: { [Op.gte]: inicioMeta, [Op.lt]: finMes },
        };
        if (admin.sucursalId !== null) wherePedido.sucursalId = admin.sucursalId;

        const pedidos = await Pedido.findAll({
            attributes: ['id', 'sucursalId', 'fecha', 'total'],
            where: wherePedido,
            include: [
                { model: Sucursal, attributes: ['id', 'nombre'], required: true, where: { activa: true } },
            ],
        });

        const porSucursal = new Map();

        pedidos.forEach((pedido) => {
            const sucursal = pedido.Sucursal;

            if (!porSucursal.has(sucursal.id)) {
                porSucursal.set(sucursal.id, {
                    sucursalId: sucursal.id,
                    nombre: sucursal.nombre,
                    ventas: 0,
                    meta: 0,
                    pedidos: 0,
                });
            }

            const fila = porSucursal.get(sucursal.id);
            const total = Number(pedido.total);

            // Lo del mes elegido suma a las ventas; lo del mes anterior, a la meta
            if (new Date(pedido.fecha) >= inicioMes) {
                fila.ventas += total;
                fila.pedidos += 1;
            } else {
                fila.meta += total;
            }
        });

        return res.json({
            mes: claveDeFecha(inicioMes).slice(0, 7),
            diasDelMes: new Date(finMes.getTime() - 1).getDate(),
            diaActual: mes === 'actual' ? hoy.getDate() : null,
            sucursales: [...porSucursal.values()].sort((a, b) => b.ventas - a.ventas),
        });
    } catch (error) {
        console.error('Error al obtener ventas por sucursal:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de ventas por sucursal',
        });
    }
};

const PRODUCTOS_POR_SUCURSAL = 5;

const obtenerProductosPorSucursal = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const wherePedido = { estado: { [Op.iLike]: 'entregado' } };
        if (admin.sucursalId !== null) wherePedido.sucursalId = admin.sucursalId;

        // Período de los botones (sin "ultimos": todo el historial)
        const periodo = obtenerPeriodo(req.query);
        if (periodo.error) return res.status(400).json({ mensaje: periodo.error });
        if (periodo.fecha) wherePedido.fecha = periodo.fecha;

        const detalles = await DetallePedido.findAll({
            attributes: ['productoId', 'cantidad'],
            include: [
                {
                    model: Pedido,
                    attributes: ['sucursalId'],
                    where: wherePedido,
                    required: true,
                    include: [
                        { model: Sucursal, attributes: ['id', 'nombre'], required: true, where: { activa: true } },
                    ],
                },
                {
                    model: Producto,
                    attributes: ['id', 'nombre'],
                    paranoid: false,
                    required: true,
                    include: [
                        { model: Categoria, as: 'categoria', attributes: ['nombre'], required: false },
                    ],
                },
            ],
        });

        // sucursalId -> { datos de la sucursal, productos: Map(productoId -> fila) }
        const porSucursal = new Map();

        detalles.forEach((detalle) => {
            const sucursal = detalle.Pedido?.Sucursal;
            const producto = detalle.Producto;
            if (!sucursal || !producto) return;

            if (!porSucursal.has(sucursal.id)) {
                porSucursal.set(sucursal.id, {
                    sucursalId: sucursal.id,
                    nombre: sucursal.nombre,
                    productos: new Map(),
                });
            }

            const productos = porSucursal.get(sucursal.id).productos;

            if (!productos.has(producto.id)) {
                productos.set(producto.id, {
                    productoId: producto.id,
                    nombre: producto.nombre,
                    categoria: producto.categoria?.nombre ?? null,
                    unidades: 0,
                });
            }

            productos.get(producto.id).unidades += Number(detalle.cantidad);
        });

        return res.json(
            [...porSucursal.values()]
                .map((sucursal) => ({
                    sucursalId: sucursal.sucursalId,
                    nombre: sucursal.nombre,
                    productos: [...sucursal.productos.values()]
                        .sort((a, b) => b.unidades - a.unidades)
                        .slice(0, PRODUCTOS_POR_SUCURSAL),
                }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre)),
        );
    } catch (error) {
        console.error('Error al obtener productos por sucursal:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de productos por sucursal',
        });
    }
};

const DIAS_ATENDIDOS = 30;

const obtenerPedidosAtendidosPorSucursal = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        // Últimos 30 días, incluyendo hoy
        const desde = new Date();
        desde.setHours(0, 0, 0, 0);
        desde.setDate(desde.getDate() - (DIAS_ATENDIDOS - 1));

        const wherePedido = {};
        if (admin.sucursalId !== null) wherePedido.sucursalId = admin.sucursalId;

        // Cada entrega con la fecha en que se creó el pedido y su sucursal
        const entregas = await historialDeTiemposPedido.findAll({
            attributes: ['pedidoId', 'fecha'],
            where: {
                estado: { [Op.iLike]: 'entregado' },
                fecha: { [Op.gte]: desde },
            },
            include: [
                {
                    model: Pedido,
                    attributes: ['id', 'fecha', 'sucursalId'],
                    required: true,
                    where: wherePedido,
                    include: [
                        { model: Sucursal, attributes: ['id', 'nombre'], required: true, where: { activa: true } },
                    ],
                },
            ],
        });

        const porSucursal = new Map();

        entregas.forEach((entrega) => {
            const pedido = entrega.Pedido;
            const sucursal = pedido?.Sucursal;
            if (!sucursal) return;

            if (!porSucursal.has(sucursal.id)) {
                porSucursal.set(sucursal.id, {
                    sucursalId: sucursal.id,
                    nombre: sucursal.nombre,
                    entregados: 0,
                    minutos: [],
                });
            }

            const fila = porSucursal.get(sucursal.id);
            fila.entregados += 1;

            const minutos = (new Date(entrega.fecha) - new Date(pedido.fecha)) / 60000;
            if (Number.isFinite(minutos) && minutos >= 0) fila.minutos.push(minutos);
        });

        return res.json(
            [...porSucursal.values()]
                .map((fila) => ({
                    sucursalId: fila.sucursalId,
                    nombre: fila.nombre,
                    entregados: fila.entregados,
                    promedioMinutos: fila.minutos.length > 0
                        ? Math.round(fila.minutos.reduce((suma, m) => suma + m, 0) / fila.minutos.length)
                        : null,
                }))
                .sort((a, b) => b.entregados - a.entregados),
        );
    } catch (error) {
        console.error('Error al obtener pedidos atendidos por sucursal:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de pedidos atendidos por sucursal',
        });
    }
};

/* =========================================================
   REPORTES DE PROMOCIONES
   Usan la promo guardada en cada línea del pedido (promocionId)
   y su precio sin descuento (precioLista). Solo pedidos entregados.
   ========================================================= */

const DIAS_DE_LA_SEMANA = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

// Líneas de pedidos entregados que se pidieron con promo (en el período, si hay)
const buscarLineasConPromo = (sucursalId, fecha = null) => {
    const wherePedido = { estado: { [Op.iLike]: 'entregado' } };
    if (sucursalId !== undefined) wherePedido.sucursalId = sucursalId;
    if (fecha) wherePedido.fecha = fecha;

    return DetallePedido.findAll({
        attributes: ['pedidoId', 'cantidad', 'precio', 'precioLista', 'promocionId'],
        where: { promocionId: { [Op.ne]: null } },
        include: [
            { model: Pedido, attributes: ['id', 'fecha'], where: wherePedido, required: true },
            {
                model: Promocion,
                as: 'promocion',
                attributes: ['id', 'titulo', 'destacado', 'tipo', 'activo'],
                required: true,
            },
        ],
    });
};

// Lo que el cliente se ahorró en una línea: (precio de lista - precio cobrado) × cantidad
const ahorroDeLinea = (linea) =>
    Math.max(0, (Number(linea.precioLista ?? linea.precio) - Number(linea.precio)) * Number(linea.cantidad));

const obtenerPromocionesMasUtilizadas = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const filtro = obtenerSucursalDelFiltro(admin, req.query);
        if (filtro.error) {
            return res.status(400).json({ mensaje: filtro.error });
        }

        // Período de los botones (sin "ultimos": todo el historial)
        const periodo = obtenerPeriodo(req.query);
        if (periodo.error) return res.status(400).json({ mensaje: periodo.error });

        const lineas = await buscarLineasConPromo(filtro.sucursalId, periodo.fecha);
        const porPromo = new Map();

        lineas.forEach((linea) => {
            const promo = linea.promocion;

            if (!porPromo.has(promo.id)) {
                porPromo.set(promo.id, {
                    promocionId: promo.id,
                    titulo: promo.titulo,
                    destacado: promo.destacado,
                    tipo: promo.tipo,
                    activa: promo.activo,
                    pedidos: new Set(),
                    unidades: 0,
                    facturacion: 0,
                    ahorro: 0,
                    usosPorDia: new Map(),
                });
            }

            const fila = porPromo.get(promo.id);

            // Cada pedido cuenta una sola vez, aunque la promo tenga varios productos
            if (!fila.pedidos.has(linea.pedidoId)) {
                fila.pedidos.add(linea.pedidoId);
                const dia = new Date(linea.Pedido.fecha).getDay();
                fila.usosPorDia.set(dia, (fila.usosPorDia.get(dia) ?? 0) + 1);
            }

            fila.unidades += Number(linea.cantidad);
            fila.facturacion += Number(linea.precio) * Number(linea.cantidad);
            fila.ahorro += ahorroDeLinea(linea);
        });

        return res.json(
            [...porPromo.values()]
                .map((fila) => {
                    const dia = elMasRepetido(fila.usosPorDia);

                    return {
                        promocionId: fila.promocionId,
                        titulo: fila.titulo,
                        destacado: fila.destacado,
                        tipo: fila.tipo,
                        activa: fila.activa,
                        veces: fila.pedidos.size,
                        unidades: fila.unidades,
                        facturacion: Math.round(fila.facturacion),
                        ahorro: Math.round(fila.ahorro),
                        diaMasUsado: dia === null ? null : DIAS_DE_LA_SEMANA[dia],
                    };
                })
                .sort((a, b) => b.veces - a.veces),
        );
    } catch (error) {
        console.error('Error al obtener promociones más utilizadas:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de promociones más utilizadas',
        });
    }
};

const obtenerImpactoPromociones = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const filtro = obtenerSucursalDelFiltro(admin, req.query);
        if (filtro.error) {
            return res.status(400).json({ mensaje: filtro.error });
        }

        const lineas = await buscarLineasConPromo(filtro.sucursalId);

        // Sin pedidos con promo todavía no hay nada que comparar
        if (lineas.length === 0) {
            return res.json({
                desde: null,
                pedidosConPromo: 0,
                pedidosSinPromo: 0,
                ventasConPromo: 0,
                ventasSinPromo: 0,
                ticketConPromo: null,
                ticketSinPromo: null,
                ahorroTotal: 0,
            });
        }

        const pedidosConPromo = new Set(lineas.map((linea) => linea.pedidoId));
        const ahorroTotal = lineas.reduce((suma, linea) => suma + ahorroDeLinea(linea), 0);

        // Se compara desde el primer pedido con promo guardada: los pedidos de antes
        // no tienen el dato y contarían todos como "sin promo".
        const desde = new Date(Math.min(...lineas.map((linea) => new Date(linea.Pedido.fecha).getTime())));

        const wherePedido = {
            estado: { [Op.iLike]: 'entregado' },
            fecha: { [Op.gte]: desde },
        };
        if (filtro.sucursalId !== undefined) wherePedido.sucursalId = filtro.sucursalId;

        const pedidos = await Pedido.findAll({
            attributes: ['id', 'total'],
            where: wherePedido,
        });

        let ventasConPromo = 0;
        let ventasSinPromo = 0;
        let cantidadCon = 0;
        let cantidadSin = 0;

        pedidos.forEach((pedido) => {
            if (pedidosConPromo.has(pedido.id)) {
                ventasConPromo += Number(pedido.total);
                cantidadCon += 1;
            } else {
                ventasSinPromo += Number(pedido.total);
                cantidadSin += 1;
            }
        });

        return res.json({
            desde,
            pedidosConPromo: cantidadCon,
            pedidosSinPromo: cantidadSin,
            ventasConPromo: Math.round(ventasConPromo),
            ventasSinPromo: Math.round(ventasSinPromo),
            ticketConPromo: cantidadCon > 0 ? Math.round(ventasConPromo / cantidadCon) : null,
            ticketSinPromo: cantidadSin > 0 ? Math.round(ventasSinPromo / cantidadSin) : null,
            ahorroTotal: Math.round(ahorroTotal),
        });
    } catch (error) {
        console.error('Error al obtener el impacto de las promociones:', error);

        return res.status(500).json({
            mensaje: 'Error al obtener el reporte de impacto de las promociones',
        });
    }
};

module.exports = {
    obtenerProductosMasVendidos, obtenerProductosMenosVendidos, obtenerProductosMayorFacturacion, obtenerProductosSinStock,
    obtenerPedidosPorEstado, obtenerPedidosPorDia, obtenerPedidosPorSucursal, obtenerCancelacionesPorDia, obtenerTiempoPromedioEntrega,
    obtenerClientesMasPedidos, obtenerClientesNuevos, obtenerClientesInactivos,
    obtenerVentasPorSucursal, obtenerProductosPorSucursal, obtenerPedidosAtendidosPorSucursal,
    obtenerPromocionesMasUtilizadas, obtenerImpactoPromociones
};