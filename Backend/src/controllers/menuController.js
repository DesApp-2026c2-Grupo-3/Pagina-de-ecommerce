const { cargarMenu, aGrupoMenu } = require('../utils/menu');

// GET /menu → los grupos y secciones del catálogo (solo lo habilitado), con ids de categorías y productos.
// El front arma con esto los botones y decide en qué sección cae cada producto.
const obtenerMenu = async (req, res) => {
    try {
        const grupos = await cargarMenu({ soloActivos: true });
        res.json({ grupos: grupos.map(aGrupoMenu) });
    } catch (error) {
        console.error('Error al obtener el menú:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener el menú' });
    }
};

module.exports = { obtenerMenu };
