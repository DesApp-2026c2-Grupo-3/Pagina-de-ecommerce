const { userSchema, loginSchema, updateSchema } = require('../schemas/usuario.schema')
const validarUsuario = (req,res,next) => {
const { error } = userSchema.validate(req.body)

    if(error){
        return res.status(400).json({
            code:error.details[0].message})

    }
    next()
} 

const validarLogin = (req,res,next) => {
    const { error } = loginSchema.validate(req.body)

    if(error){
        return res.status(400).json({
            code:error.details[0].message})
    }
    next()
} 

const validarActualizarUsuario = (req, res, next) => {
    const { error } = updateSchema.validate(req.body)

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        })
    }
    next()
}


module.exports = { validarUsuario, validarLogin, validarActualizarUsuario }
