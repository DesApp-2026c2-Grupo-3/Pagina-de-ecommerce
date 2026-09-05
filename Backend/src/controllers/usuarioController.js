const bcrypt = require('bcrypt');

const { Usuario } = require('../models')

const verUsuarios = async (req,res) => {
    try{
        
        const usuarios = await Usuario.findAll()
        
        res.status(200).json(usuarios)

    }
    catch(error){
        console.error('Algo salio mal',error.message)
        res.status(500).json({mensaje:'Error del servidor'})
    }
}

const crearUsuario = async (req,res) => {

    try{
        const { nombre, email, password } = req.body

        const nombreNormalizado = nombre.trim();
        const emailNormalizado = email.trim().toLowerCase();

        const validarEmail = await Usuario.findOne({where:{email: emailNormalizado}})

        if(validarEmail){
            return res.status(409).json({code:"email-en-uso"})
        }

        const passwordEncriptada = await bcrypt.hash(password, 10);

        const nuevoUsuario = await Usuario.create({ 
            nombre:nombreNormalizado,
            email: emailNormalizado,
            password: passwordEncriptada })
        
        return  res.status(201).json({
            id: nuevoUsuario.id, nombre: nuevoUsuario.nombre, email: nuevoUsuario.email})

    } catch(error){
        console.error('Algo salio mal',error.message)
        res.status(500).json({mensaje:'Error del servidor'})
    }
}

const login = async(req,res) =>{
    try{
        const { email, password } = req.body

        const emailNormalizado = email.trim().toLowerCase()

        const user = await Usuario.findOne({where:{email: emailNormalizado}})

        if(!user){
            return res.status(401).json({code:"email-password-incorrectos"})
        }

        const passwordCorrecta = await bcrypt.compare( password, user.password );

        if (!passwordCorrecta) {
            return res.status(401).json({
                code: "email-password-incorrectos"
            });
        }
        
        return res.status(200).json({id: user.id,nombre: user.nombre, email: user.email})
    }catch(error){
        console.error('Error al loguear:', error.message);
        return res.status(500).json({
            mensaje:'Error al loguear',
            error:error.message})
    }
}


module.exports = { verUsuarios, crearUsuario, login };