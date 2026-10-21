// Opciones de la cookie de sesión del panel admin.
// Deben coincidir con el login/logout (adminController) para que el navegador la borre.
const opcionesCookie = () => ({
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
});

// Borra la cookie de sesión cuando el token venció o es inválido
const limpiarCookieSesion = (res) => res.clearCookie("access_token", opcionesCookie());

module.exports = { opcionesCookie, limpiarCookieSesion };
