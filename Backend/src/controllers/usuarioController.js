const bcrypt = require('bcrypt');
const crypto = require('crypto');

const { Usuario, Sucursal, TokenRecuperacion } = require('../models')

const { enviarCorreoRecuperacion } = require('../services/emailServices');

// Hash de relleno: se usa en el login cuando el email no existe,
// para que la respuesta tarde lo mismo y no revele qué emails están registrados.
const HASH_FALSO = bcrypt.hashSync('contraseña-que-no-existe', 10);
const RESPUESTA_REGISTRO = { mensaje: '¡Tu cuenta fue creada! Iniciá sesión para continuar.' };

const verUsuarios = async (req,res) => {
    try{
        const usuarios = await Usuario.findAll({ attributes: { exclude: ['password'] } })

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

        // Se encripta siempre, aunque el email ya exista, para que las dos respuestas tarden lo mismo
        const passwordEncriptada = await bcrypt.hash(password, 10);

        const usuarioExistente = await Usuario.findOne({where:{email: emailNormalizado}})

        if (usuarioExistente) {
            // Mensaje genérico: no se aclara que el email ya está en uso
            return res.status(400).json({ code: 'No se pudo completar el registro' })
        }

        await Usuario.create({
            nombre: nombreNormalizado,
            email: emailNormalizado,
            password: passwordEncriptada
        })

        return res.status(201).json(RESPUESTA_REGISTRO)

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

        // Se compara siempre (con un hash falso si el email no existe),
        // así el tiempo de respuesta no revela si la cuenta existe
        const passwordCorrecta = await bcrypt.compare(password, user ? user.password : HASH_FALSO);

        if (!user || !passwordCorrecta) {
            return res.status(401).json({ code: "email-password-incorrectos" });
        }

        return res.status(200).json({id: user.id,nombre: user.nombre, email: user.email})
    }catch(error){
        console.error('Error al loguear:', error.message);
        return res.status(500).json({ mensaje:'Error al loguear' })
    }
}


const solicitarRecuperacion = async (req, res) => {
    try {
        const emailNormalizado = req.body.email.trim().toLowerCase();
        const usuario = await Usuario.findOne({
            where: { email: emailNormalizado }
        });

        // No revelar si el email está registrado.
        const respuesta = {
            mensaje: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña.'
        };

        if (!usuario) {
            return res.status(200).json(respuesta);
        }

        // Invalidar solicitudes anteriores pendientes del mismo usuario.
        await TokenRecuperacion.destroy({
            where: {
                usuarioId: usuario.id,
                usadoEn: null
            }
        });

        // El token original se enviará por correo; solo guardamos su hash.
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const expiraEn = new Date(Date.now() + 15 * 60 * 1000);

        await TokenRecuperacion.create({
            usuarioId: usuario.id,
            tokenHash,
            expiraEn,
            usadoEn: null
        });

        await enviarCorreoRecuperacion(emailNormalizado, token);

        return res.status(200).json(respuesta);
    } catch (error) {
        console.error('Error al solicitar recuperación:', error.message);
        return res.status(500).json({
            mensaje: 'Error del servidor'
        });
    }
};


const restablecerPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (
            typeof token !== 'string' ||
            !token.trim() ||
            typeof password !== 'string' ||
            password.length < 6 ||
            password.length > 20 ||
            !/\S/.test(password)
        ) {
            return res.status(400).json({
                mensaje: 'El token es obligatorio y la contraseña debe tener entre 6 y 20 caracteres, sin estar compuesta solo por espacios.'
            });
        }

        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const { sequelize, TokenRecuperacion, Usuario } = require('../models');

        await sequelize.transaction(async (transaction) => {
            const solicitud = await TokenRecuperacion.findOne({
                where: {
                    tokenHash,
                    usadoEn: null
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!solicitud || solicitud.expiraEn <= new Date()) {
                const error = new Error('El token es inválido o ha expirado.');
                error.status = 400;
                throw error;
            }

            const usuario = await Usuario.findByPk(solicitud.usuarioId, {
                transaction
            });

            if (!usuario) {
                const error = new Error('El token es inválido o ha expirado.');
                error.status = 400;
                throw error;
            }

            usuario.password = await bcrypt.hash(password, 10);
            await usuario.save({ transaction });

            solicitud.usadoEn = new Date();
            await solicitud.save({ transaction });
        });

        return res.status(200).json({
            mensaje: 'La contraseña se restableció correctamente.'
        });
    } catch (error) {
        if (error.status === 400) {
            return res.status(400).json({ mensaje: error.message });
        }

        console.error('Error al restablecer contraseña:', error.message);
        return res.status(500).json({
            mensaje: 'Error del servidor'
        });
    }
};


const obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id, {
            attributes: ['id', 'nombre', 'apellido', 'email', 'telefono', 'dni', 'fechaNacimiento', 'sucursalId'],
            include: [{ model: Sucursal, attributes: ['id', 'nombre', 'localidad'] }],
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

const actualizarSucursalPredeterminada = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const { sucursalId } = req.body;

        if (sucursalId) {
            const sucursal = await Sucursal.findByPk(sucursalId);
            if (!sucursal) {
                return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
            }
        }

        await usuario.update({ sucursalId: sucursalId ?? null });

        const usuarioActualizado = await Usuario.findByPk(usuario.id, {
            attributes: ['id', 'nombre', 'apellido', 'email', 'telefono', 'dni', 'fechaNacimiento', 'sucursalId'],
            include: [{ model: Sucursal, attributes: ['id', 'nombre', 'localidad'] }],
        });

        res.status(200).json(usuarioActualizado);
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

        const { nombre, apellido, email, telefono, dni, fechaNacimiento, password, passwordActual } = req.body;

        // Si viene una password nueva, hay que validar la actual primero
        if (password) {
            if (!passwordActual) {
                return res.status(400).json({ code: 'password-actual-requerida' });
            }

            const passwordCorrecta = await bcrypt.compare(passwordActual, usuario.password);

            if (!passwordCorrecta) {
                return res.status(401).json({ code: 'password-actual-incorrecta' });
            }
        }

        // Si cambia el email, no puede estar en uso por otra cuenta
        const emailNuevo = email?.trim().toLowerCase();
        if (emailNuevo && emailNuevo !== usuario.email) {
            const emailEnUso = await Usuario.findOne({ where: { email: emailNuevo } });
            if (emailEnUso) {
                return res.status(409).json({ code: 'email-no-disponible' });
            }
        }

        const datosActualizados = {
            nombre: nombre?.trim() ?? usuario.nombre,
            apellido: apellido ?? usuario.apellido,
            email: emailNuevo ?? usuario.email,
            telefono: telefono ?? usuario.telefono,
            dni: dni ?? usuario.dni,
            fechaNacimiento: fechaNacimiento || usuario.fechaNacimiento,
        };

        if (password) {
            datosActualizados.password = await bcrypt.hash(password, 10);
        }

        await usuario.update(datosActualizados);

        return res.status(200).json({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            telefono: usuario.telefono,
            dni: usuario.dni,
            fechaNacimiento: usuario.fechaNacimiento,
        });
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = { verUsuarios, crearUsuario, login, solicitarRecuperacion, restablecerPassword, obtenerUsuarioPorId, actualizarUsuario, actualizarSucursalPredeterminada };