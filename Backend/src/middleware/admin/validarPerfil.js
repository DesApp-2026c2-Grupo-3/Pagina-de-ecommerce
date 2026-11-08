const { cambiarPasswordSchema } = require('../../schemas/admin/perfil.schema');

const validarCambioPassword = (req, res, next) => {
    const { value, error } = cambiarPasswordSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: error.details[0].message });
    }
    req.body = value;
    next();
};

module.exports = { validarCambioPassword };
