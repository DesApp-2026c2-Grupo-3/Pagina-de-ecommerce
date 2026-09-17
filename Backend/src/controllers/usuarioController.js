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

const obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id, {
            attributes: ['id', 'nombre', 'email', 'telefono', 'direccion'],
        });

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.status(200).json(usuario);
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

const actualizarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const { nombre, email, telefono, direccion, password } = req.body;

        const datosActualizados = {
            nombre: nombre?.trim() ?? usuario.nombre,
            email: email?.trim().toLowerCase() ?? usuario.email,
            telefono: telefono ?? usuario.telefono,
            direccion: direccion ?? usuario.direccion,
        };

        if (password) {
            datosActualizados.password = await bcrypt.hash(password, 10);
        }

        await usuario.update(datosActualizados);

        return res.status(200).json({
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            telefono: usuario.telefono,
            direccion: usuario.direccion,
        });
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = { verUsuarios, crearUsuario, login, obtenerUsuarioPorId, actualizarUsuario };