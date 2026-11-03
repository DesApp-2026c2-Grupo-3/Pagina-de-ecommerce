const { QueryTypes } = require('sequelize');
const { Admin, sequelize } = require('../../models');

// Las calificaciones llegan al admin-master (todas las sucursales) y al admin de sucursal (solo la suya).
// Cada calificación es de un PEDIDO: filtrar por producto muestra las calificaciones de los pedidos que lo incluyen.

const POR_PAGINA_MAXIMO = 50;
const POR_PAGINA = 10;
const MS_DIA = 24 * 60 * 60 * 1000;

const esEntero = (valor) => /^\d+$/.test(String(valor)) && Number(valor) > 0;
const esFecha = (valor) => /^\d{4}-\d{2}-\d{2}$/.test(String(valor)) && !Number.isNaN(Date.parse(valor));

// Lee y valida los filtros de la URL. Devuelve { filtros } o { error }.
async function leerFiltros(req) {
    const admin = await Admin.findByPk(req.usuario.id);
    if (!admin) return { error: { status: 401, mensaje: 'Iniciá sesión de nuevo' } };

    const { sucursalId, productoId, puntaje, conComentario, desde, hasta } = req.query;
    const filtros = {};

    // El admin de sucursal solo ve la suya, pida lo que pida
    if (admin.sucursalId !== null) {
        filtros.sucursalId = Number(admin.sucursalId);
    } else if (sucursalId !== undefined && sucursalId !== '') {
        if (!esEntero(sucursalId)) return { error: { status: 400, mensaje: 'La sucursal no es válida' } };
        filtros.sucursalId = Number(sucursalId);
    }

    if (productoId !== undefined && productoId !== '') {
        if (!esEntero(productoId)) return { error: { status: 400, mensaje: 'El producto no es válido' } };
        filtros.productoId = Number(productoId);
    }

    if (puntaje !== undefined && puntaje !== '') {
        if (!/^[1-5]$/.test(String(puntaje))) return { error: { status: 400, mensaje: 'El puntaje debe ser de 1 a 5' } };
        filtros.puntaje = Number(puntaje);
    }

    if (conComentario === 'true') filtros.conComentario = true;

    // Las fechas se interpretan en hora argentina; "hasta" incluye todo ese día
    if (desde !== undefined && desde !== '') {
        if (!esFecha(desde)) return { error: { status: 400, mensaje: 'La fecha desde no es válida' } };
        filtros.desde = new Date(`${desde}T00:00:00-03:00`);
    }
    if (hasta !== undefined && hasta !== '') {
        if (!esFecha(hasta)) return { error: { status: 400, mensaje: 'La fecha hasta no es válida' } };
        filtros.hasta = new Date(new Date(`${hasta}T00:00:00-03:00`).getTime() + MS_DIA);
    }
    if (filtros.desde && filtros.hasta && filtros.desde >= filtros.hasta) {
        return { error: { status: 400, mensaje: 'La fecha desde no puede ser posterior a la fecha hasta' } };
    }

    return { filtros };
}

// El WHERE de todas las consultas (la tabla de calificaciones siempre se llama "c")
function armarWhere(filtros) {
    const condiciones = [];
    const replacements = {};

    if (filtros.sucursalId !== undefined) {
        condiciones.push('c."sucursalId" = :sucursalId');
        replacements.sucursalId = filtros.sucursalId;
    }
    if (filtros.productoId !== undefined) {
        condiciones.push('EXISTS (SELECT 1 FROM "DetallePedidos" dp WHERE dp."pedidoId" = c."pedidoId" AND dp."productoId" = :productoId)');
        replacements.productoId = filtros.productoId;
    }
    if (filtros.puntaje !== undefined) {
        condiciones.push('c.puntaje = :puntaje');
        replacements.puntaje = filtros.puntaje;
    }
    if (filtros.conComentario) condiciones.push('c.comentario IS NOT NULL');
    if (filtros.desde) {
        condiciones.push('c."createdAt" >= :desde');
        replacements.desde = filtros.desde;
    }
    if (filtros.hasta) {
        condiciones.push('c."createdAt" < :hasta');
        replacements.hasta = filtros.hasta;
    }

    return {
        where: condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '',
        replacements,
    };
}

const consultar = (sql, replacements) => sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
const aNumero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

// GET /admin/calificaciones/resumen → promedio, distribución por estrellas, y los desgloses por sucursal, producto y semana
const obtenerResumen = async (req, res) => {
    try {
        const { filtros, error } = await leerFiltros(req);
        if (error) return res.status(error.status).json({ mensaje: error.mensaje });

        const { where, replacements } = armarWhere(filtros);

        const [general] = await consultar(
            `SELECT COUNT(*)::int AS total,
                    ROUND(AVG(c.puntaje)::numeric, 2) AS promedio,
                    COUNT(*) FILTER (WHERE c.puntaje = 1)::int AS p1,
                    COUNT(*) FILTER (WHERE c.puntaje = 2)::int AS p2,
                    COUNT(*) FILTER (WHERE c.puntaje = 3)::int AS p3,
                    COUNT(*) FILTER (WHERE c.puntaje = 4)::int AS p4,
                    COUNT(*) FILTER (WHERE c.puntaje = 5)::int AS p5,
                    COUNT(*) FILTER (WHERE c.comentario IS NOT NULL)::int AS "conComentario"
             FROM "Calificaciones" c ${where}`,
            replacements
        );

        // Solo tiene sentido comparar sucursales si no hay una elegida (el admin de sucursal no las compara)
        const porSucursal = filtros.sucursalId === undefined
            ? await consultar(
                `SELECT c."sucursalId" AS id, s.nombre, COUNT(*)::int AS total, ROUND(AVG(c.puntaje)::numeric, 2) AS promedio
                 FROM "Calificaciones" c LEFT JOIN "Sucursals" s ON s.id = c."sucursalId"
                 ${where}
                 GROUP BY c."sucursalId", s.nombre
                 ORDER BY promedio DESC, total DESC`,
                replacements
            )
            : [];

        // Un pedido con el mismo producto en dos líneas cuenta una sola vez (DISTINCT)
        const porProducto = filtros.productoId === undefined
            ? await consultar(
                `SELECT x."productoId" AS id, p.nombre, COUNT(*)::int AS total, ROUND(AVG(x.puntaje)::numeric, 2) AS promedio
                 FROM (SELECT DISTINCT c.id, c.puntaje, d."productoId"
                       FROM "Calificaciones" c JOIN "DetallePedidos" d ON d."pedidoId" = c."pedidoId"
                       ${where}) x
                 JOIN "Productos" p ON p.id = x."productoId"
                 JOIN "Categoria" cat ON cat.id = p."categoriaId" AND cat."esComplemento" = false
                 GROUP BY x."productoId", p.nombre
                 ORDER BY total DESC, promedio DESC
                 LIMIT 10`,
                replacements
            )
            : [];

        const semanas = await consultar(
            `SELECT to_char(date_trunc('week', c."createdAt" AT TIME ZONE 'America/Argentina/Buenos_Aires'), 'YYYY-MM-DD') AS semana,
                    COUNT(*)::int AS total, ROUND(AVG(c.puntaje)::numeric, 2) AS promedio
             FROM "Calificaciones" c ${where}
             GROUP BY 1
             ORDER BY 1 DESC
             LIMIT 12`,
            replacements
        );

        return res.json({
            total: general.total,
            promedio: aNumero(general.promedio),
            conComentario: general.conComentario,
            distribucion: { 1: general.p1, 2: general.p2, 3: general.p3, 4: general.p4, 5: general.p5 },
            porSucursal: porSucursal.map((s) => ({ id: s.id, nombre: s.nombre ?? 'Sin sucursal', total: s.total, promedio: aNumero(s.promedio) })),
            porProducto: porProducto.map((p) => ({ id: p.id, nombre: p.nombre, total: p.total, promedio: aNumero(p.promedio) })),
            // De la más vieja a la más nueva, para dibujarla de izquierda a derecha
            porSemana: semanas.map((s) => ({ semana: s.semana, total: s.total, promedio: aNumero(s.promedio) })).reverse(),
        });
    } catch (error) {
        console.error('Error al obtener el resumen de calificaciones:', error.message);
        return res.status(500).json({ mensaje: 'Error al obtener el resumen de calificaciones' });
    }
};

// GET /admin/calificaciones?pagina=1&limite=10 + los mismos filtros → datos crudos, de la más nueva a la más vieja
const obtenerCalificaciones = async (req, res) => {
    try {
        const { filtros, error } = await leerFiltros(req);
        if (error) return res.status(error.status).json({ mensaje: error.mensaje });

        const pagina = esEntero(req.query.pagina) ? Number(req.query.pagina) : 1;
        const limite = esEntero(req.query.limite) ? Math.min(Number(req.query.limite), POR_PAGINA_MAXIMO) : POR_PAGINA;

        const { where, replacements } = armarWhere(filtros);

        const [{ total }] = await consultar(`SELECT COUNT(*)::int AS total FROM "Calificaciones" c ${where}`, replacements);

        const filas = await consultar(
            `SELECT c.id, c.puntaje, c.comentario, c."createdAt" AS fecha, c."pedidoId", c."sucursalId",
                    s.nombre AS "sucursalNombre", u.nombre AS "clienteNombre", u.apellido AS "clienteApellido",
                    pe.total AS "pedidoTotal", pe.fecha AS "pedidoFecha",
                    COALESCE((SELECT array_agg(DISTINCT pr.nombre)
                              FROM "DetallePedidos" dd JOIN "Productos" pr ON pr.id = dd."productoId"
                              WHERE dd."pedidoId" = c."pedidoId"), '{}') AS productos
             FROM "Calificaciones" c
             JOIN "Pedidos" pe ON pe.id = c."pedidoId"
             JOIN "Usuarios" u ON u.id = c."usuarioId"
             LEFT JOIN "Sucursals" s ON s.id = c."sucursalId"
             ${where}
             ORDER BY c."createdAt" DESC, c.id DESC
             LIMIT :limite OFFSET :offset`,
            { ...replacements, limite, offset: (pagina - 1) * limite }
        );

        return res.json({
            total,
            pagina,
            limite,
            calificaciones: filas.map((f) => ({
                id: f.id,
                puntaje: f.puntaje,
                comentario: f.comentario,
                fecha: f.fecha,
                cliente: { nombre: f.clienteNombre, apellido: f.clienteApellido },
                pedido: { id: f.pedidoId, total: aNumero(f.pedidoTotal), fecha: f.pedidoFecha },
                sucursal: { id: f.sucursalId, nombre: f.sucursalNombre ?? 'Sin sucursal' },
                productos: f.productos ?? [],
            })),
        });
    } catch (error) {
        console.error('Error al obtener las calificaciones:', error.message);
        return res.status(500).json({ mensaje: 'Error al obtener las calificaciones' });
    }
};

// GET /admin/calificaciones/filtros → lo que se puede elegir en los filtros:
// las sucursales (solo el master las elige) y los productos que aparecen en pedidos calificados
const obtenerFiltros = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });

        const deSucursal = admin.sucursalId !== null;

        const sucursales = deSucursal
            ? []
            : await consultar('SELECT id, nombre FROM "Sucursals" ORDER BY nombre', {});

        const productos = await consultar(
            `SELECT DISTINCT p.id, p.nombre
             FROM "Calificaciones" c
             JOIN "DetallePedidos" d ON d."pedidoId" = c."pedidoId"
             JOIN "Productos" p ON p.id = d."productoId"
             JOIN "Categoria" cat ON cat.id = p."categoriaId" AND cat."esComplemento" = false
             ${deSucursal ? 'WHERE c."sucursalId" = :sucursalId' : ''}
             ORDER BY p.nombre`,
            deSucursal ? { sucursalId: Number(admin.sucursalId) } : {}
        );

        return res.json({ sucursales, productos });
    } catch (error) {
        console.error('Error al obtener los filtros de calificaciones:', error.message);
        return res.status(500).json({ mensaje: 'Error al obtener los filtros' });
    }
};

module.exports = { obtenerResumen, obtenerCalificaciones, obtenerFiltros };
