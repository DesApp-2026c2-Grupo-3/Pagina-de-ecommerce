const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
require('dotenv').config()
const jwt = require('jsonwebtoken');


const { Admin, Sucursal } = require('../../models')

// La sucursal se devuelve solo con los datos que necesita el panel
const SUCURSAL = { model: Sucursal, attributes: ['id', 'nombre'] };

// Lo que se devuelve de un admin (nunca la contraseña)
function datosDe(admin) {
    return {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol,
        sucursalId: admin.sucursalId ?? null,
        sucursal: admin.Sucursal ? { id: admin.Sucursal.id, nombre: admin.Sucursal.nombre } : null,
    };
}

// Un ADMIN tiene que gestionar una sucursal que exista y esté activa
async function validarSucursal(sucursalId) {
    if (!sucursalId) return 'Elegí la sucursal que va a gestionar';
    const sucursal = await Sucursal.findByPk(sucursalId);
    if (!sucursal || !sucursal.activa) return 'La sucursal elegida no existe o está inactiva';
    return '';
}

const verAdmins = async (req, res) => {
    try {
        const admins = await Admin.findAll({
            where: { rol: { [Op.ne]: 'MASTER' } },
            attributes: ['id', 'nombre', 'email', 'rol', 'sucursalId', 'createdAt'],
            include: [SUCURSAL],
            order: [['nombre', 'ASC']],
        });

        res.status(200).json(admins.map((admin) => ({ ...datosDe(admin), createdAt: admin.createdAt })))
    }
    catch (error) {
        console.error('Algo salio mal', error.message)
        res.status(500).json({ mensaje: 'Error del servidor' })
    }
}

const crearAdmin = async (req, res) => {
    try {
        const { nombre, email, password, sucursalId } = req.body

        const nombreNormalizado = nombre.trim();
        const emailNormalizado = email.trim().toLowerCase();

        const errorSucursal = await validarSucursal(sucursalId);
        if (errorSucursal) {
            return res.status(400).json({ code: errorSucursal })
        }

        const validarEmail = await Admin.findOne({ where: { email: emailNormalizado } })
        if (validarEmail) {
            return res.status(409).json({ code: "email-en-uso" })
        }

        const passwordEncriptada = await bcrypt.hash(password, 10);

        // Los admins que se crean desde el panel son siempre de sucursal
        const nuevoAdmin = await Admin.create({
            nombre: nombreNormalizado,
            email: emailNormalizado,
            password: passwordEncriptada,
            rol: 'ADMIN',
            sucursalId,
        })

        await nuevoAdmin.reload({ include: [SUCURSAL] });

        return res.status(201).json(datosDe(nuevoAdmin))

    } catch (error) {
        console.error('Algo salio mal', error.message)
        res.status(500).json({ mensaje: 'Error del servidor' })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        const emailNormalizado = email.trim().toLowerCase()

        const admin = await Admin.findOne({
            where: { email: emailNormalizado },
            include: [SUCURSAL],
        })

        if (!admin) {
            return res.status(401).json({ code: "email-password-incorrectos" })
        }

        const passwordCorrecta = await bcrypt.compare(password, admin.password);

        if (!passwordCorrecta) {
            return res.status(401).json({ code: "email-password-incorrectos" });
        }
        const SECRET_JWT_TOKEN = process.env.SECRET_JWT_TOKEN;

        const token = jwt.sign({ id: admin.id, nombre: admin.nombre, rol: admin.rol }, SECRET_JWT_TOKEN, { expiresIn: "4h" })

        return res.cookie("access_token", token, {
            httpOnly: true,
            sameSite: "strict",
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 4
        }).status(200).json(datosDe(admin));
    } catch (error) {
        console.error('Error al loguear:', error.message);
        return res.status(500).json({ mensaje: 'Error al loguear' })
    }
}

const logout = async (req, res) => {
    try {
        return res.clearCookie("access_token", {
            httpOnly: true,
            sameSite: "strict",
            path: '/',
            secure: process.env.NODE_ENV === 'production'
        }).status(200).json({ mensaje: "Sesión cerrada" })
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
        return res.status(500).json({ mensaje: 'Error al cerrar sesión' })
    }
}

const obtenerAdminPorId = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id, {
            attributes: ['id', 'nombre', 'email', 'rol', 'sucursalId'],
            include: [SUCURSAL],
        });

        if (!admin) {
            return res.status(404).json({ mensaje: 'Administrador no encontrado' });
        }

        res.status(200).json(datosDe(admin));
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

const actualizarAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id);

        if (!admin) {
            return res.status(404).json({ mensaje: 'Administrador no encontrado' });
        }

        const { nombre, email, password, sucursalId } = req.body;

        const emailNormalizado = email?.trim().toLowerCase() ?? admin.email;

        const adminConEseEmail = await Admin.findOne({ where: { email: emailNormalizado } });
        if (adminConEseEmail && adminConEseEmail.id !== admin.id) {
            return res.status(409).json({ code: "email-en-uso" });
        }

        const datosActualizados = {
            nombre: nombre?.trim() ?? admin.nombre,
            email: emailNormalizado,
        };

        // El MASTER no tiene sucursal; a un ADMIN se le puede cambiar
        if (sucursalId !== undefined && admin.rol !== 'MASTER') {
            const errorSucursal = await validarSucursal(sucursalId);
            if (errorSucursal) {
                return res.status(400).json({ code: errorSucursal });
            }
            datosActualizados.sucursalId = sucursalId;
        }

        if (password) {
            datosActualizados.password = await bcrypt.hash(password, 10);
        }

        await admin.update(datosActualizados);
        await admin.reload({ include: [SUCURSAL] });

        return res.status(200).json(datosDe(admin));
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

const eliminarAdmin = async (req, res) => {
    try {
        const { id } = req.params;

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

module.exports = { verAdmins, crearAdmin, login, logout, obtenerAdminPorId, actualizarAdmin, eliminarAdmin };