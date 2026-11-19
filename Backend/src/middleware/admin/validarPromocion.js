const { promocionSchema } = require('../../schemas/admin/promocion.schema');

const validarPromocion = (req, res, next) => {
    const { value, error } = promocionSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }
    req.body = value;
    next();
};

module.exports = { validarPromocion };
