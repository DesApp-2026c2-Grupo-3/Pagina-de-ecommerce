const mockFindOne = jest.fn();
jest.mock('../../src/models', () => ({ CierreSucursal: { findOne: (...a) => mockFindOne(...a) } }));

const { sucursalCerrada } = require('../../src/utils/cierres');

describe('sucursalCerrada', () => {
    beforeEach(() => mockFindOne.mockReset());

    it('es true si hay un cierre sin reabrir', async () => {
        mockFindOne.mockResolvedValue({ id: 3 });
        await expect(sucursalCerrada(2)).resolves.toBe(true);
        expect(mockFindOne).toHaveBeenCalledWith(expect.objectContaining({ where: { sucursalId: 2, reabiertoEn: null } }));
    });

    it('es false si no hay cierre activo', async () => {
        mockFindOne.mockResolvedValue(null);
        await expect(sucursalCerrada(2)).resolves.toBe(false);
    });

    it('sin sucursal no consulta nada', async () => {
        await expect(sucursalCerrada(undefined)).resolves.toBe(false);
        expect(mockFindOne).not.toHaveBeenCalled();
    });
});
