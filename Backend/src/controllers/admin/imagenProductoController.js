const { Producto } = require('../../models');
const { cloudinaryConfigurado } = require('../../config/cloudinary');
const { CARPETA_PRODUCTOS, subirImagenProducto, borrarImagen } = require('../../utils/imagenesCloudinary');

// POST /admin/productos/imagen (multipart, campo "imagen")
// Sube la imagen a Cloudinary y devuelve { url, publicId }. El formulario del admin
// la sube al guardar y después manda url y publicId junto con el resto del producto.
const subirImagen = async (req, res) => {
    if (!cloudinaryConfigurado()) {
        return res.status(503).json({ mensaje: 'Cloudinary no está configurado en el servidor (revisá el .env)' });
    }
    try {
        const { url, publicId } = await subirImagenProducto(req.file.buffer);
        return res.status(201).json({ url, publicId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al subir la imagen' });
    }
};

// DELETE /admin/productos/imagen?publicId=productos/xxxx
// Descarta una imagen recién subida que al final no se usó (por ejemplo, si falló el guardado del producto).
// Solo borra imágenes de la carpeta de productos que ningún producto tenga asignada.
const descartarImagen = async (req, res) => {
    const { publicId } = req.query;
    if (typeof publicId !== 'string' || !publicId.startsWith(`${CARPETA_PRODUCTOS}/`)) {
        return res.status(400).json({ code: 'Imagen inválida' });
    }
    try {
        // paranoid: false → también cuenta los productos eliminados (los pedidos viejos los muestran)
        const enUso = await Producto.count({ where: { imagenPublicId: publicId }, paranoid: false });
        if (enUso > 0) {
            return res.status(409).json({ mensaje: 'La imagen la está usando un producto' });
        }
        await borrarImagen(publicId);
        return res.status(200).json({ mensaje: 'Imagen descartada' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al descartar la imagen' });
    }
};

module.exports = { subirImagen, descartarImagen };