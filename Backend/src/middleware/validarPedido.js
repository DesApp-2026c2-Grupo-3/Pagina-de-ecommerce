const { pedidoSchema } = require('../schemas/pedido.schema')

const validarPedido = (req, res, next) => {
    const { value, error } = pedidoSchema.validate(req.body)

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        })
    }
    req.body = value
    next()
}

module.exports = { validarPedido }