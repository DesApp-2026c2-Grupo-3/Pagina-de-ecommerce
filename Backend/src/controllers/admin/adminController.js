const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
require('dotenv').config()
const jwt = require('jsonwebtoken');


const { Admin, Sucursal } = require('../../models')
const { ROLES } = require('../../config/roles');
const { rolQueCrea, puedeGestionar } = require('../../utils/permisosAdmin');
const { DOMINIO_PERSONAL, esEmailDePersonal } = require('../../utils/emailPersonal');

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


// Cada sucursal tiene 2 encargados activos (regla fija) y los empleados que fije el master (maxEmpleados).
// Devuelve el mensaje de error, o '' si hay lugar. excluirId: el admin que se está moviendo o reactivando.
const MAX_ENCARGADOS_POR_SUCURSAL = 2;

async function validarCupo(rol, sucursalId, excluirId = null) {
    if (rol !== ROLES.ADMIN && rol !== ROLES.EMPLEADO) return '';

    const where = { rol, sucursalId, activo: true };
    if (excluirId) where.id = { [Op.ne]: excluirId };
    const activos = await Admin.count({ where });

    if (rol === ROLES.ADMIN && activos >= MAX_ENCARGADOS_POR_SUCURSAL) {
        return `La sucursal ya tiene ${MAX_ENCARGADOS_POR_SUCURSAL} encargados activos`;
    }
    if (rol === ROLES.EMPLEADO) {
        const sucursal = await Sucursal.findByPk(sucursalId);
        const cupo = sucursal?.maxEmpleados ?? 0;
        if (activos >= cupo) return `La sucursal ya alcanzó su cupo de ${cupo} empleados`;
    }
    return '';
}

const verAdmins = async (req, res) => {
    try {
        // El master ve a todos los admins; el encargado, solo a los empleados de su sucursal
        const actor = req.usuario;
        const where = actor.rol === ROLES.ADMIN
            ? { rol: ROLES.EMPLEADO, sucursalId: actor.sucursalId }
            : { rol: { [Op.ne]: ROLES.MASTER } };

        const admins = await Admin.findAll({
            where,
            attributes: [
                'id','nombre','email', 'rol', 'sucursalId','activo','createdAt'
            ],
            include: [SUCURSAL],
            order: [['nombre', 'ASC']],
        });

        res.status(200).json(
            admins.map((admin) => ({
                ...datosDe(admin),
                activo: admin.activo,
                createdAt: admin.createdAt
            }))
        );
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};


const crearAdmin = async (req, res) => {
    try {
        const { nombre, email, password } = req.body

        // El master crea encargados (ADMIN); el encargado, empleados de SU sucursal
        const actor = req.usuario;
        const rol = rolQueCrea(actor);
        if (!rol) {
            return res.status(403).json({ mensaje: 'No tenés permiso para crear administradores' });
        }
        const sucursalId = actor.rol === ROLES.ADMIN ? actor.sucursalId : req.body.sucursalId;

        const nombreNormalizado = nombre.trim();
        const emailNormalizado = email.trim().toLowerCase();

        const errorSucursal = await validarSucursal(sucursalId);
        if (errorSucursal) {
            return res.status(400).json({ code: errorSucursal })
        }

        const errorCupo = await validarCupo(rol, sucursalId);
        if (errorCupo) {
            return res.status(409).json({ mensaje: errorCupo, code: errorCupo })
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
            rol,
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

        if (!admin.activo) {
            return res.status(401).json({
                code: "email-password-incorrectos"
            });
        }

        const passwordCorrecta = await bcrypt.compare(password, admin.password);

        if (!passwordCorrecta) {
            return res.status(401).json({ code: "email-password-incorrectos" });
        }
        const SECRET_JWT_TOKEN = process.env.SECRET_JWT_TOKEN;

        // const token = jwt.sign({ id: admin.id, nombre: admin.nombre, rol: admin.rol }, SECRET_JWT_TOKEN, { expiresIn: "120s" })
        const token = jwt.sign({ id: admin.id, nombre: admin.nombre, rol: admin.rol }, SECRET_JWT_TOKEN, { expiresIn: "4h" })

        return res.cookie("access_token", token, {
            httpOnly: true,
            sameSite: "lax",
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            // maxAge: 2 * 60 * 1000
            maxAge: 4 * 60 * 60 * 1000
        }).status(200).json(datosDe(admin));
    } catch (error) {
        console.error('Error al loguear:', error.message);
        return res.status(500).json({ mensaje: 'Error al loguear' })
    }
}

const logout = async (req, res) => {
    try {
        // sameSite/path/secure deben coincidir con el login: si no, el navegador no borra la cookie
        return res.clearCookie("access_token", {
            httpOnly: true,
            sameSite: "lax",
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
        if (!puedeGestionar(req.usuario, admin)) {
            return res.status(403).json({ mensaje: 'No podés gestionar a este administrador' });
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

        if (!puedeGestionar(req.usuario, admin)) {
            return res.status(403).json({ mensaje: 'No podés gestionar a este administrador' });
        }

        const { nombre, email, password, sucursalId } = req.body;

        const emailNormalizado = email?.trim().toLowerCase() ?? admin.email;

        // El personal (encargados y empleados) usa mail laboral
        if (admin.rol !== ROLES.MASTER && !esEmailDePersonal(emailNormalizado)) {
            return res.status(400).json({ code: `El email del personal debe ser ${DOMINIO_PERSONAL}` });
        }

        const adminConEseEmail = await Admin.findOne({ where: { email: emailNormalizado } });
        if (adminConEseEmail && adminConEseEmail.id !== admin.id) {
            return res.status(409).json({ code: "email-en-uso" });
        }

        const datosActualizados = {
            nombre: nombre?.trim() ?? admin.nombre,
            email: emailNormalizado,
        };

        // El MASTER no tiene sucursal; solo el master puede mover a un admin de sucursal
        if (sucursalId !== undefined && admin.rol !== ROLES.MASTER && req.usuario.rol === ROLES.MASTER) {
            const errorSucursal = await validarSucursal(sucursalId);
            if (errorSucursal) {
                return res.status(400).json({ code: errorSucursal });
            }
            // Al mover a un admin activo de sucursal, la de destino tiene que tener lugar
            if (admin.activo && Number(sucursalId) !== Number(admin.sucursalId)) {
                const errorCupo = await validarCupo(admin.rol, sucursalId, admin.id);
                if (errorCupo) {
                    return res.status(409).json({ mensaje: errorCupo, code: errorCupo });
                }
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
        if (!puedeGestionar(req.usuario, admin)) {
            return res.status(403).json({ mensaje: 'No podés gestionar a este administrador' });
        }

        admin.activo = false;
        await admin.save();
        
        return res.status(200).json({ mensaje: "Administrador eliminado con éxito" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al eliminar el Administrador' });
    }
};


const reactivarAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await Admin.findByPk(id);

        if (!admin) {
            return res.status(404).json({
                mensaje: 'Administrador no encontrado'
            });
        }

        if (admin.rol === "MASTER") {
            return res.status(403).json({
                mensaje: 'Error al intentar reactivar el administrador'
            });
        }
        if (!puedeGestionar(req.usuario, admin)) {
            return res.status(403).json({ mensaje: 'No podés gestionar a este administrador' });
        }

        if (admin.activo) {
            return res.status(400).json({
                mensaje: 'El administrador ya está activo'
            });
        }

        // Al reactivar, la sucursal tiene que tener lugar para ese rol
        const errorCupo = await validarCupo(admin.rol, admin.sucursalId, admin.id);
        if (errorCupo) {
            return res.status(409).json({ mensaje: errorCupo, code: errorCupo });
        }

        admin.activo = true;
        await admin.save();

        return res.status(200).json({
            mensaje: 'Administrador reactivado con éxito'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            mensaje: 'Error al reactivar el administrador'
        });
    }
};

module.exports = { verAdmins, crearAdmin, login, logout, obtenerAdminPorId, actualizarAdmin, eliminarAdmin, reactivarAdmin };