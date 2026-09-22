const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const esIdValido = (id) => !isNaN(id) && Number.isInteger(Number(id));

const { Admin } = require('../../models')

const verAdmins = async (req, res) => {
    try {
        const admins = await Admin.findAll({
            where:{
                rol:{
                    [Op.ne]: 'MASTER'
                }
            },
            attributes: ['id', 'nombre', 'email', 'rol', 'createdAt']
        });
        res.status(200).json(admins)

    }
    catch (error) {
        console.error('Algo salio mal', error.message)
        res.status(500).json({ mensaje: 'Error del servidor' })
    }
}

const crearAdmin = async (req, res) => {

    try {
        const { nombre, email, password } = req.body

        const nombreNormalizado = nombre.trim();
        const emailNormalizado = email.trim().toLowerCase();

        const validarEmail = await Admin.findOne({ where: { email: emailNormalizado } })

        if (validarEmail) {
            return res.status(409).json({ code: "email-en-uso" })
        }

        const passwordEncriptada = await bcrypt.hash(password, 10);

        const nuevoAdmin = await Admin.create({
            nombre: nombreNormalizado,
            email: emailNormalizado,
            password: passwordEncriptada
        })

        return res.status(201).json({
            id: nuevoAdmin.id, nombre: nuevoAdmin.nombre, email: nuevoAdmin.email, rol: nuevoAdmin.rol
        })

    } catch (error) {
        console.error('Algo salio mal', error.message)
        res.status(500).json({ mensaje: 'Error del servidor' })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        const emailNormalizado = email.trim().toLowerCase()

        const admin = await Admin.findOne({ where: { email: emailNormalizado } })

        if (!admin) {
            return res.status(401).json({ code: "email-password-incorrectos" })
        }

        const passwordCorrecta = await bcrypt.compare(password, admin.password);

        if (!passwordCorrecta) {
            return res.status(401).json({
                code: "email-password-incorrectos"
            });
        }

        return res.status(200).json({ id: admin.id, nombre: admin.nombre, email: admin.email, rol: admin.rol })
    } catch (error) {
        console.error('Error al loguear:', error.message);
        return res.status(500).json({
            mensaje: 'Error al loguear',
            error: error.message
        })
    }
}

const obtenerAdminPorId = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id, {
            attributes: ['id', 'nombre', 'email', 'rol'],
        });

        if (!admin) {
            return res.status(404).json({ mensaje: 'administrador no encontrado' });
        }

        res.status(200).json(admin);
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

const actualizarAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id);

        if (!admin) {
            return res.status(404).json({ mensaje: 'administrador no encontrado' });
        }

        const { nombre, email, password } = req.body;

        const emailNormalizado = email?.trim().toLowerCase() ?? admin.email;

        const adminConEseEmail = await Admin.findOne({
            where: { email: emailNormalizado }
        });

        if (adminConEseEmail && adminConEseEmail.id !== admin.id) {
            return res.status(409).json({ code: "email-en-uso" });
        }

        const datosActualizados = {
            nombre: nombre?.trim() ?? admin.nombre,
            email: email?.trim().toLowerCase() ?? admin.email,
        };

        if (password) {
            datosActualizados.password = await bcrypt.hash(password, 10);
        }

        await admin.update(datosActualizados);

        return res.status(200).json({
            id: admin.id,
            nombre: admin.nombre,
            email: admin.email,
        });
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};
const eliminarAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!esIdValido(id)) {
            return res.status(400).json({ mensaje: 'El ID debe ser un número válido' });
        }

        const admin = await Admin.findByPk(id);

        if (!admin) {
            return res.status(404).json({ mensaje: 'Administrador no encontrado' });
        }
        if (admin.rol == "MASTER") {
            return res.status(403).json({ mensaje: 'Error al intentar eliminar el administrador' });
        }

        await admin.destroy();

        return res.status(200).json({ mensaje: "Administrador eliminado con éxito" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al eliminar el Administrador' });
    }
};
module.exports = { verAdmins, crearAdmin, login, obtenerAdminPorId, actualizarAdmin, eliminarAdmin };