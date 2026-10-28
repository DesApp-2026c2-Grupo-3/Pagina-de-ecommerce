const { Pedido, DetallePedido,Producto,Admin,Sucursal,StockSucursal,
    RecetaInsumo,ProductoTamanio,ComboGrupo,Insumo,sequelize,historialDeTiemposPedido
} = require('../../models');

const { Op } = require('sequelize');

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
                },
            ],
            group: [
                'DetallePedido.productoId',
                'Producto.id',
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
            group: ['Producto.id'],
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
                },
            ],
            group: ['DetallePedido.productoId', 'Producto.id'],
            order: [
                [sequelize.literal('"facturacion"'), 'DESC'],
            ],
        });

        return res.json(
            productos.map((producto) => ({
                productoId: producto.productoId,
                nombre: producto.Producto.nombre,
                imagen: producto.Producto.imagen,
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




module.exports = {
    obtenerProductosMasVendidos, obtenerProductosMenosVendidos, obtenerProductosMayorFacturacion, obtenerProductosSinStock,
    obtenerPedidosPorEstado, obtenerPedidosPorDia, obtenerPedidosPorSucursal, obtenerCancelacionesPorDia, obtenerTiempoPromedioEntrega
};