const jwt = require('jsonwebtoken');

const esAdminJwt = (req, res, next) => {
    try {
        const SECRET_JWT_TOKEN = process.env.SECRET_JWT_TOKEN;
        const token = req.cookies.access_token;

        if (!token) {
            return res.status(401).json({ msj: "Acceso no autorizado" });
        }
        const data = jwt.verify(token, SECRET_JWT_TOKEN);

        if (data.rol !== "ADMIN" && data.rol !== "MASTER") {
            return res.status(403).json({ msj: "Acceso no autorizado" });
        }
        req.usuario = data;

        next();

    } catch (error) {
        return res.status(401).json({ msj: "Token inválido o expirado" });
    }
};

module.exports = { esAdminJwt };