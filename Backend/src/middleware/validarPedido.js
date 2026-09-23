const { pedidoSchema } = require('../schemas/pedido.schema')

const validarPedido = (req, res, next) => {
    const { error } = pedidoSchema.validate(req.body)

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        })
    }
    next()
}

module.exports = { validarPedido }