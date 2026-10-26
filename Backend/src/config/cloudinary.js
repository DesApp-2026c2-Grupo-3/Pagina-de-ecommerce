require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Credenciales en Backend/.env. Nunca van al frontend.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// true si están las tres variables (sin ellas no se puede subir ni borrar)
const cloudinaryConfigurado = () =>
    Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );

module.exports = { cloudinary, cloudinaryConfigurado };