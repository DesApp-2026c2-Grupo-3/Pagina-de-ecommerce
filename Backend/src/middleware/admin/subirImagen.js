const multer = require('multer');

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANIO_MAXIMO_MB = 20;

// El archivo queda en memoria (req.file.buffer): se comprime y se sube a Cloudinary sin pasar por el disco
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: TAMANIO_MAXIMO_MB * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (TIPOS_PERMITIDOS.includes(file.mimetype)) return cb(null, true);
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'tipo'));
    },
});

// Recibe un único archivo en el campo "imagen" y devuelve errores claros en español
const subirImagen = (req, res, next) => {
    upload.single('imagen')(req, res, (error) => {
        if (error) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ code: `La imagen no puede pesar más de ${TAMANIO_MAXIMO_MB} MB` });
            }
            if (error.field === 'tipo') {
                return res.status(400).json({ code: 'La imagen tiene que ser JPG, PNG o WEBP' });
            }
            return res.status(400).json({ code: 'No se pudo leer la imagen' });
        }
        if (!req.file) {
            return res.status(400).json({ code: 'Elegí una imagen para subir' });
        }
        next();
    });
};

module.exports = { subirImagen, TIPOS_PERMITIDOS, TAMANIO_MAXIMO_MB };