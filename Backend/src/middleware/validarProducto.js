const { productoSchema } = require('../schemas/producto.schema')

const validarProducto = (req, res, next) => {
    const { error } = productoSchema.validate(req.body)

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        })
    }
    next()
}

module.exports = { validarProducto }