const { Op } = require('sequelize');
const {
    MenuGrupo, MenuGrupoCategoria, MenuSeccion, MenuSeccionProducto, Categoria, Producto, sequelize,
} = require('../../models');
const { cargarMenu, aGrupoMenu } = require('../../utils/menu');

// El menú del catálogo lo arma solo el Admin-Master (las rutas pasan por esMasterJwt).
// Se lee y se guarda completo: así el panel puede mostrar la vista previa de lo que todavía no guardó
// y el cambio es de una sola vez (o se aplica todo o no se toca nada).

class ErrorMenu extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

const unicos = (lista) => [...new Set(lista)];

// Cada categoría y cada producto nombrados en el menú tienen que existir
async function validarExistencia(menu, transaction) {
    const categoriaIds = unicos(menu.grupos.flatMap((g) => [
        ...g.categoriaIds,
        ...g.secciones.map((s) => s.categoriaId).filter((id) => id !== null),
    ]));
    if (categoriaIds.length > 0) {
        const existentes = await Categoria.findAll({ where: { id: { [Op.in]: categoriaIds } }, attributes: ['id'], transaction });
        if (existentes.length !== categoriaIds.length) {
            throw new ErrorMenu(400, 'Alguna de las categorías elegidas no existe');
        }
    }

    const productoIds = unicos(menu.grupos.flatMap((g) => g.secciones.flatMap((s) => s.productoIds)));
    if (productoIds.length > 0) {
        // Los productos eliminados no cuentan: no se pueden poner en una sección
        const existentes = await Producto.findAll({ where: { id: { [Op.in]: productoIds } }, attributes: ['id'], transaction });
        if (existentes.length !== productoIds.length) {
            throw new ErrorMenu(400, 'Alguno de los productos elegidos no existe o fue eliminado');
        }
    }
}

// Cada grupo con secciones tiene una (y solo una) por defecto: ahí caen los productos que ninguna sección reclama
function conSeccionPorDefecto(secciones) {
    if (secciones.length === 0) return secciones;
    const indice = secciones.findIndex((s) => s.esPorDefecto && s.activo);
    const elegida = indice >= 0 ? indice : Math.max(0, secciones.findIndex((s) => s.activo));
    return secciones.map((s, i) => ({ ...s, esPorDefecto: i === elegida }));
}

const responderError = (res, error, mensajePorDefecto) => {
    if (error instanceof ErrorMenu) {
        return res.status(error.status).json({ mensaje: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: mensajePorDefecto });
};

// GET /admin/menu → todo el menú, también lo deshabilitado
const obtenerMenu = async (req, res) => {
    try {
        const grupos = await cargarMenu({ soloActivos: false });
        return res.json({ grupos: grupos.map(aGrupoMenu) });
    } catch (error) {
        return responderError(res, error, 'Error al obtener el menú');
    }
};

// PUT /admin/menu → reemplaza el menú entero por el que llega
const guardarMenu = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const menu = req.body;
        await validarExistencia(menu, t);

        // Las filas hijas se borran solas (ON DELETE CASCADE)
        await MenuGrupo.destroy({ where: {}, transaction: t });

        for (const [indiceGrupo, grupo] of menu.grupos.entries()) {
            const creado = await MenuGrupo.create({
                slug: grupo.slug,
                nombre: grupo.nombre,
                orden: (indiceGrupo + 1) * 10,
                porSecciones: grupo.porSecciones,
                activo: grupo.activo,
            }, { transaction: t });

            if (grupo.categoriaIds.length > 0) {
                await MenuGrupoCategoria.bulkCreate(
                    grupo.categoriaIds.map((categoriaId) => ({ grupoId: creado.id, categoriaId })),
                    { transaction: t }
                );
            }

            for (const [indiceSeccion, seccion] of conSeccionPorDefecto(grupo.secciones).entries()) {
                const seccionCreada = await MenuSeccion.create({
                    grupoId: creado.id,
                    slug: seccion.slug,
                    nombre: seccion.nombre,
                    orden: (indiceSeccion + 1) * 10,
                    icono: seccion.icono,
                    fondo: seccion.fondo,
                    categoriaId: seccion.categoriaId,
                    esPorDefecto: seccion.esPorDefecto,
                    activo: seccion.activo,
                }, { transaction: t });

                if (seccion.productoIds.length > 0) {
                    await MenuSeccionProducto.bulkCreate(
                        seccion.productoIds.map((productoId, indice) => ({
                            seccionId: seccionCreada.id, productoId, orden: (indice + 1) * 10,
                        })),
                        { transaction: t }
                    );
                }
            }
        }

        const guardado = await cargarMenu({ soloActivos: false, transaction: t });
        await t.commit();
        return res.status(200).json({ mensaje: 'Menú guardado con éxito', grupos: guardado.map(aGrupoMenu) });
    } catch (error) {
        if (!t.finished) await t.rollback();
        return responderError(res, error, 'Error al guardar el menú');
    }
};

module.exports = { obtenerMenu, guardarMenu };
