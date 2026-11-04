const mockSingle = jest.fn();

jest.mock('multer', () => {
    const multer = jest.fn(() => ({ single: mockSingle }));
    multer.memoryStorage = jest.fn(() => ({ almacenamiento: 'memoria' }));
    multer.MulterError = class MulterError extends Error {
        constructor(code, field) {
            super(code);
            this.code = code;
            this.field = field;
        }
    };
    return multer;
});

const multer = require('multer');
const {
    subirImagen,
    TIPOS_PERMITIDOS,
    TAMANIO_MAXIMO_MB,
} = require('../../../src/middleware/admin/subirImagen');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function simularError(error, req = {}) {
    mockSingle.mockReturnValue((_req, _res, cb) => cb(error));
    return req;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
        require('../../../src/middleware/admin/subirImagen');
    });
});

describe('configuración de multer', () => {
    test('usa memoria, un archivo y un límite de 20 MB', () => {
        expect(multer.memoryStorage).toHaveBeenCalled();
        expect(multer).toHaveBeenCalledWith(expect.objectContaining({
            limits: { fileSize: 20 * 1024 * 1024, files: 1 },
        }));
        expect(TAMANIO_MAXIMO_MB).toBe(20);
    });

    test('acepta JPG, PNG y WEBP', () => {
        const { fileFilter } = multer.mock.calls[0][0];

        TIPOS_PERMITIDOS.forEach((tipo) => {
            const cb = jest.fn();
            fileFilter({}, { mimetype: tipo }, cb);
            expect(cb).toHaveBeenCalledWith(null, true);
        });
    });

    test('rechaza otros tipos de archivo', () => {
        const { fileFilter } = multer.mock.calls[0][0];
        const cb = jest.fn();

        fileFilter({}, { mimetype: 'application/pdf' }, cb);

        const error = cb.mock.calls[0][0];
        expect(error).toBeInstanceOf(multer.MulterError);
        expect(error.field).toBe('tipo');
    });
});

describe('subirImagen', () => {
    test('continúa cuando el archivo es válido', () => {
        const req = { file: { buffer: Buffer.from('x') } };
        mockSingle.mockReturnValue((_req, _res, cb) => cb(null));
        const next = jest.fn();

        subirImagen(req, crearRes(), next);

        expect(mockSingle).toHaveBeenCalledWith('imagen');
        expect(next).toHaveBeenCalled();
    });

    test('responde 400 si no se eligió una imagen', () => {
        mockSingle.mockReturnValue((_req, _res, cb) => cb(null));
        const res = crearRes();
        const next = jest.fn();

        subirImagen({}, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Elegí una imagen para subir' });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 400 si la imagen supera el tamaño máximo', () => {
        const error = new multer.MulterError('LIMIT_FILE_SIZE');
        const res = crearRes();

        subirImagen(simularError(error), res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].code).toContain('20 MB');
    });

    test('responde 400 si el tipo de archivo no es válido', () => {
        const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'tipo');
        const res = crearRes();

        subirImagen(simularError(error), res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'La imagen tiene que ser JPG, PNG o WEBP' });
    });

    test('responde 400 ante otro error de lectura', () => {
        const res = crearRes();

        subirImagen(simularError(new Error('otro')), res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'No se pudo leer la imagen' });
    });
});
