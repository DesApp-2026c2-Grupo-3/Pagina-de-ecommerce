const { sucursalSchema } = require('../../schemas/admin/sucursal.schema');

const validarSucursal = (req, res, next) => {
    const { value, error } = sucursalSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }
    req.body = value;
    next();
};

module.exports = { validarSucursal };