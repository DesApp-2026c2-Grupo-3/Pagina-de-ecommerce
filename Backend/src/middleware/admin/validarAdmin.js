const { adminSchema } = require('../../schemas/admin/admin.schema');

const validarAdmin = (req, res, next) => {
    const { value, error } = adminSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }
    req.body = value;
    next();
};

module.exports = { validarAdmin };