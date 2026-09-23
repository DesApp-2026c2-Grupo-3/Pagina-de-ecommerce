const { productoSchema } = require('../schemas/producto.schema')

const validarProducto = (req, res, next) => {
    const { value, error } = productoSchema.validate(req.body)

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        })
    }
    req.body = value
    next()
}

module.exports = { validarProducto }