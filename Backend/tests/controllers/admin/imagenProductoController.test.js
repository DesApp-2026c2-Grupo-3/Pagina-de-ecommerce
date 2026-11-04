jest.mock('../../../src/models', () => ({
    Producto: { count: jest.fn() },
}));

jest.mock('../../../src/config/cloudinary', () => ({
    cloudinaryConfigurado: jest.fn(),
}));

jest.mock('../../../src/utils/imagenesCloudinary', () => ({
    CARPETA_PRODUCTOS: 'productos',
    subirImagenProducto: jest.fn(),
    borrarImagen: jest.fn(),
}));

const { Producto } = require('../../../src/models');
const { cloudinaryConfigurado } = require('../../../src/config/cloudinary');
const { subirImagenProducto, borrarImagen } = require('../../../src/utils/imagenesCloudinary');
const { subirImagen, descartarImagen } = require('../../../src/controllers/admin/imagenProductoController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    cloudinaryConfigurado.mockReturnValue(true);
});

describe('subirImagen', () => {
    test('responde 503 si Cloudinary no está configurado', async () => {
        cloudinaryConfigurado.mockReturnValue(false);
        const res = crearRes();

        await subirImagen({ file: { buffer: Buffer.from('x') } }, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(subirImagenProducto).not.toHaveBeenCalled();
    });

    test('sube la imagen y devuelve url y publicId', async () => {
        subirImagenProducto.mockResolvedValue({ url: 'https://img/1.png', publicId: 'productos/1' });
        const buffer = Buffer.from('imagen');
        const res = crearRes();

        await subirImagen({ file: { buffer } }, res);

        expect(subirImagenProducto).toHaveBeenCalledWith(buffer);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ url: 'https://img/1.png', publicId: 'productos/1' });
    });

    test('responde 500 si falla la subida', async () => {
        subirImagenProducto.mockRejectedValue(new Error('Cloudinary caído'));
        const res = crearRes();

        await subirImagen({ file: { buffer: Buffer.from('x') } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al subir la imagen' });
    });
});

describe('descartarImagen', () => {
    test('rechaza un publicId que no es de productos', async () => {
        const res = crearRes();

        await descartarImagen({ query: { publicId: 'otros/1' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Imagen inválida' });
        expect(Producto.count).not.toHaveBeenCalled();
    });

    test('rechaza un publicId que no es string', async () => {
        const res = crearRes();

        await descartarImagen({ query: { publicId: 123 } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('no borra una imagen que usa un producto', async () => {
        Producto.count.mockResolvedValue(1);
        const res = crearRes();

        await descartarImagen({ query: { publicId: 'productos/1' } }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(borrarImagen).not.toHaveBeenCalled();
    });

    test('borra una imagen que no está en uso', async () => {
        Producto.count.mockResolvedValue(0);
        const res = crearRes();

        await descartarImagen({ query: { publicId: 'productos/1' } }, res);

        expect(Producto.count).toHaveBeenCalledWith({
            where: { imagenPublicId: 'productos/1' },
            paranoid: false,
        });
        expect(borrarImagen).toHaveBeenCalledWith('productos/1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Imagen descartada' });
    });

    test('responde 500 si falla la consulta', async () => {
        Producto.count.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await descartarImagen({ query: { publicId: 'productos/1' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al descartar la imagen' });
    });
});
