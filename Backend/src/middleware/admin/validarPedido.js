const { pedidoAdminSchema, pedidoEstadoAdminSchema } = require('../../schemas/admin/pedidoAdminSchema');

const validarPedido = (req, res, next) => {
    const { value, error } = pedidoAdminSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }
    req.body = value;
    next();
};

const validarEstadoPedido = (req, res, next) => {
    const { value, error } = pedidoEstadoAdminSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }
    req.body = value;
    next();
};

module.exports = { validarPedido, validarEstadoPedido };
