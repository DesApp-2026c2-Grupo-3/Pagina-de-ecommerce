const { horarioSucursalSchema, permisoHorarioSchema } = require('../../schemas/admin/sucursal.schema');

const validarCon = (schema) => (req, res, next) => {
    const { value, error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }
    req.body = value;
    next();
};

// PATCH /admin/sucursales/horario/:id → { horario }
const validarHorarioSucursal = validarCon(horarioSucursalSchema);

// PATCH /admin/sucursales/permiso-horario/:id → { encargadoEditaHorario }
const validarPermisoHorario = validarCon(permisoHorarioSchema);

module.exports = { validarHorarioSucursal, validarPermisoHorario };
