const { menuSchema } = require('../../schemas/admin/menu.schema');

const validarMenu = (req, res, next) => {
    const { value, error } = menuSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: error.details[0].message });
    }
    req.body = value;
    next();
};

module.exports = { validarMenu };
