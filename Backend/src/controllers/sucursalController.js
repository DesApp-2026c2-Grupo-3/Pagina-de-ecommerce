const { Sucursal, CierreSucursal } = require('../models');

// GET /sucursales → sucursales activas (público: lo usa el mapa de Home)
const obtenerSucursales = async (req, res) => {
    try {
        const [sucursales, cierres] = await Promise.all([
            Sucursal.findAll({
            where: { activa: true },
            attributes: [
                'id',
                'nombre',
                'calle',
                'numero',
                'localidad',
                'provincia',
                'codigoPostal',
                'telefono',
                'horario',
                'zona_horaria',
                'latitud',
                'longitud',
                'radioEntregaKm',
            ],
            order: [['nombre', 'ASC']],
            }),
            // Cierres temporales activos: el cliente los ve como "cerrada temporalmente" (sin el motivo)
            CierreSucursal.findAll({ where: { reabiertoEn: null }, attributes: ['sucursalId'] }),
        ]);
        const cerradas = new Set((cierres ?? []).map((c) => c.sucursalId));

        res.json(sucursales.map((s) => ({
            ...(typeof s.toJSON === 'function' ? s.toJSON() : s),
            cierreTemporal: cerradas.has(s.id),
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener las sucursales' });
    }
};

module.exports = {
    obtenerSucursales,
};
