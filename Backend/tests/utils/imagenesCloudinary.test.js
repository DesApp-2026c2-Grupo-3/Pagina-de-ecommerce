
const sharp = require('sharp');
const { cloudinary } = require('../../src/config/cloudinary');

const {
    CARPETA_PRODUCTOS,
    subirImagenProducto,
    borrarImagen,
} = require('../../src/utils/imagenesCloudinary');

jest.mock('sharp', () => jest.fn(() => ({
    rotate: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('imagen-webp')),
})));

jest.mock('../../src/config/cloudinary', () => ({
    cloudinary: {
        uploader: {
            upload_stream: jest.fn(),
            destroy: jest.fn(),
        },
    },
}));

describe('imagenesCloudinary', () => {
    const bufferOriginal = Buffer.from('imagen-original');
    const bufferComprimido = Buffer.from('imagen-webp');

    beforeEach(() => {
        jest.clearAllMocks();

        cloudinary.uploader.upload_stream.mockImplementation(
            (opciones, callback) => ({
                end: jest.fn(() => {
                    callback(null, {
                        secure_url: 'https://cloudinary.com/imagen.webp',
                        public_id: 'productos/imagen',
                    });
                }),
            })
        );
    });

    describe('CARPETA_PRODUCTOS', () => {
        test('utiliza la carpeta productos', () => {
            expect(CARPETA_PRODUCTOS).toBe('productos');
        });
    });

    describe('subirImagenProducto', () => {
        test('comprime la imagen y la sube a Cloudinary', async () => {
            const resultado = await subirImagenProducto(bufferOriginal);

            expect(sharp).toHaveBeenCalledWith(bufferOriginal);

            const pipeline = sharp.mock.results[0].value;

            expect(pipeline.rotate).toHaveBeenCalled();
            expect(pipeline.resize).toHaveBeenCalledWith({
                width: 1200,
                withoutEnlargement: true,
            });
            expect(pipeline.webp).toHaveBeenCalledWith({
                quality: 85,
            });
            expect(pipeline.toBuffer).toHaveBeenCalled();

            expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
                {
                    folder: 'productos',
                    resource_type: 'image',
                },
                expect.any(Function)
            );

            expect(resultado).toEqual({
                url: 'https://cloudinary.com/imagen.webp',
                publicId: 'productos/imagen',
            });
        });

        test('reemplaza la imagen cuando recibe un publicId', async () => {
            const resultado = await subirImagenProducto(bufferOriginal, {
                publicId: 'productos/fast-classic',
            });

            expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
                {
                    public_id: 'productos/fast-classic',
                    overwrite: true,
                    invalidate: true,
                    resource_type: 'image',
                },
                expect.any(Function)
            );

            expect(resultado.publicId).toBe('productos/imagen');
        });

        test('rechaza la operación si falla la compresión', async () => {
            const error = new Error('Error al comprimir');

            const pipeline = {
                rotate: jest.fn().mockReturnThis(),
                resize: jest.fn().mockReturnThis(),
                webp: jest.fn().mockReturnThis(),
                toBuffer: jest.fn().mockRejectedValue(error),
            };

            sharp.mockReturnValueOnce(pipeline);

            await expect(
                subirImagenProducto(bufferOriginal)
            ).rejects.toThrow('Error al comprimir');

            expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
        });

        test('rechaza la operación si falla la subida a Cloudinary', async () => {
            cloudinary.uploader.upload_stream.mockImplementation(
                (opciones, callback) => ({
                    end: jest.fn(() => {
                        callback(new Error('Error de Cloudinary'), null);
                    }),
                })
            );

            await expect(
                subirImagenProducto(bufferOriginal)
            ).rejects.toThrow('Error de Cloudinary');
        });
    });

    describe('borrarImagen', () => {
        test('no hace nada si no recibe un publicId', async () => {
            await borrarImagen(null);

            expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
        });

        test('elimina la imagen de Cloudinary', async () => {
            cloudinary.uploader.destroy.mockResolvedValue({
                result: 'ok',
            });

            await borrarImagen('productos/fast-classic');

            expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
                'productos/fast-classic',
                { invalidate: true }
            );
        });

        test('registra el error si falla el borrado sin interrumpir el flujo', async () => {
            const error = new Error('Error al eliminar');
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            cloudinary.uploader.destroy.mockRejectedValue(error);

            await expect(
                borrarImagen('productos/fast-classic')
            ).resolves.toBeUndefined();

            expect(consoleSpy).toHaveBeenCalledWith(
                'No se pudo borrar la imagen productos/fast-classic de Cloudinary:',
                'Error al eliminar'
            );

            consoleSpy.mockRestore();
        });
    });
});
