const { updateSchema } = require('../../schemas/admin/admin.schema');

const validarUpdateAdmin = (req, res, next) => {
    const { value, error } = updateSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }
    req.body = value;
    next();
};

module.exports = { validarUpdateAdmin };