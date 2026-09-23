const { loginSchema } = require('../../schemas/admin/admin.schema')

const validarLoginAdmin = (req, res, next) => {
    const { value, error } = loginSchema.validate(req.body)

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        })
    }
    req.body = value
    next()
}

module.exports = { validarLoginAdmin }