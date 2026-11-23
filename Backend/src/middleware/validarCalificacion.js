const { crearCalificacionSchema } = require('../schemas/calificacion.schema');
const validar = (schema) => (req, res, next) => {
    const { value, error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: error.details[0].message });
    }
    req.body = value;
    next();
};

module.exports = {
    validarCrearCalificacion: validar(crearCalificacionSchema),
};
