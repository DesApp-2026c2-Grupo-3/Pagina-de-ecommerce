const sharp = require('sharp');
const { cloudinary } = require('../config/cloudinary');

// Carpeta de Cloudinary donde viven las imágenes de los productos
const CARPETA_PRODUCTOS = 'productos';

// Ancho máximo con el que se guarda una imagen: alcanza para el detalle del producto
// y evita subir fotos de varios MB (los PNG originales llegan a pesar 16 MB).
const ANCHO_MAXIMO = 1200;

// Achica la imagen y la pasa a WebP (conserva la transparencia de los PNG)
async function comprimir(buffer) {
    return sharp(buffer)
        .rotate() // respeta la orientación de las fotos de celular
        .resize({ width: ANCHO_MAXIMO, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
}

// Sube la imagen ya comprimida. Con publicId (ej: "productos/fast-classic") la reemplaza si existe:
// así una semilla puede correrse varias veces sin duplicar imágenes.
// Devuelve { url, publicId }.
async function subirImagenProducto(buffer, { publicId } = {}) {
    const comprimida = await comprimir(buffer);

    const opciones = publicId
        ? { public_id: publicId, overwrite: true, invalidate: true }
        : { folder: CARPETA_PRODUCTOS };

    const resultado = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { ...opciones, resource_type: 'image' },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(comprimida);
    });

    return { url: resultado.secure_url, publicId: resultado.public_id };
}

// Borra una imagen de Cloudinary. Nunca corta el flujo: si falla, solo lo registra
// (una imagen que sobra en Cloudinary no rompe nada; un error acá no debe romper el guardado).
async function borrarImagen(publicId) {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (error) {
        console.error(`No se pudo borrar la imagen ${publicId} de Cloudinary:`, error.message);
    }
}

module.exports = { CARPETA_PRODUCTOS, subirImagenProducto, borrarImagen };