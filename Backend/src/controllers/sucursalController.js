const { Sucursal } = require('../models');
const { obtenerParametros } = require('../utils/parametros');
// GET /sucursales → sucursales activas (público: lo usa el mapa de Home)
const obtenerSucursales = async (req, res) => {
    try {
        const sucursales = await Sucursal.findAll({
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
            ],
            order: [['nombre', 'ASC']],
        });

          // El radio es uno solo para todas (Parámetros). Se agrega a cada sucursal para que la tienda
          // lo siga leyendo como antes.
          const { radioEntregaKm } = await obtenerParametros();
          res.json(sucursales.map((s) => ({ ...s.toJSON(), radioEntregaKm })));    
        } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener las sucursales' });
    }
};

module.exports = {
    obtenerSucursales,
};
