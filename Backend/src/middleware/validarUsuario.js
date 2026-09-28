const { userSchema, loginSchema, updateSchema } = require('../schemas/usuario.schema')

// Crea un middleware que valida con el esquema y deja en req.body los datos ya limpios
function validarCon(schema) {
    return (req, res, next) => {
        const { value, error } = schema.validate(req.body)

        if (error) {
            return res.status(400).json({
                code: error.details[0].message
            })
        }
        req.body = value
        next()
    }
}

const validarUsuario = validarCon(userSchema)
const validarLogin = validarCon(loginSchema)
const validarActualizarUsuario = validarCon(updateSchema)

module.exports = { validarUsuario, validarLogin, validarActualizarUsuario }