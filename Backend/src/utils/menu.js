const { MenuGrupo, MenuGrupoCategoria, MenuSeccion, MenuSeccionProducto } = require('../models');

// Trae los grupos del menú con sus categorías, secciones y productos puestos a mano, en orden.
// soloActivos: el catálogo del cliente no ve lo que el master deshabilitó; el panel sí.
async function cargarMenu({ soloActivos = true, transaction } = {}) {
    return MenuGrupo.findAll({
        where: soloActivos ? { activo: true } : {},
        include: [
            { model: MenuGrupoCategoria, as: 'categorias', attributes: ['categoriaId'], required: false },
            {
                model: MenuSeccion,
                as: 'secciones',
                required: false,
                ...(soloActivos ? { where: { activo: true } } : {}),
                include: [{ model: MenuSeccionProducto, as: 'productos', attributes: ['productoId', 'orden'], required: false }],
            },
        ],
        order: [
            ['orden', 'ASC'],
            ['id', 'ASC'],
            [{ model: MenuSeccion, as: 'secciones' }, 'orden', 'ASC'],
            [{ model: MenuSeccion, as: 'secciones' }, 'id', 'ASC'],
        ],
        transaction,
    });
}

const porOrden = (a, b) => a.orden - b.orden;

// El menú como lo usan el catálogo y el panel. Solo ids: los nombres de productos y categorías ya los tiene el front.
function aGrupoMenu(grupo) {
    return {
        id: grupo.id,
        slug: grupo.slug,
        nombre: grupo.nombre,
        porSecciones: grupo.porSecciones,
        activo: grupo.activo,
        categoriaIds: (grupo.categorias ?? []).map((c) => c.categoriaId),
        secciones: [...(grupo.secciones ?? [])].sort(porOrden).map((s) => ({
            id: s.id,
            slug: s.slug,
            nombre: s.nombre,
            activo: s.activo,
            icono: s.icono ?? null,
            fondo: s.fondo ?? null,
            categoriaId: s.categoriaId ?? null,
            esPorDefecto: s.esPorDefecto,
            productoIds: [...(s.productos ?? [])].sort(porOrden).map((p) => p.productoId),
        })),
    };
}

module.exports = { cargarMenu, aGrupoMenu };
