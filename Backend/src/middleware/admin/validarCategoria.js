const { categoriaSchema } = require('../../schemas/admin/adminCategoria.schema')

const validarCategoria = (req, res, next) => {
    const { value, error } = categoriaSchema.validate(req.body)
    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        })
    }
    req.body = value
    next()
}

module.exports = { validarCategoria }