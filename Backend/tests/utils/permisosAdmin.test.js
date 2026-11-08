const { rolQueCrea, puedeGestionar } = require('../../src/utils/permisosAdmin');

describe('rolQueCrea', () => {
    it('el master crea encargados', () => expect(rolQueCrea({ rol: 'MASTER' })).toBe('ADMIN'));
    it('el encargado crea empleados', () => expect(rolQueCrea({ rol: 'ADMIN', sucursalId: 1 })).toBe('EMPLEADO'));
    it('el empleado no crea a nadie', () => expect(rolQueCrea({ rol: 'EMPLEADO', sucursalId: 1 })).toBeNull());
    it('sin actor no crea a nadie', () => expect(rolQueCrea(undefined)).toBeNull());
});

describe('puedeGestionar', () => {
    const empleado = (sucursalId) => ({ rol: 'EMPLEADO', sucursalId });

    it('el master gestiona a cualquiera', () => {
        expect(puedeGestionar({ rol: 'MASTER' }, { rol: 'ADMIN', sucursalId: 1 })).toBe(true);
        expect(puedeGestionar({ rol: 'MASTER' }, empleado(2))).toBe(true);
    });
    it('el encargado gestiona a los empleados de su sucursal', () => {
        expect(puedeGestionar({ rol: 'ADMIN', sucursalId: 2 }, empleado(2))).toBe(true);
    });
    it('el encargado no gestiona empleados de otra sucursal', () => {
        expect(puedeGestionar({ rol: 'ADMIN', sucursalId: 2 }, empleado(5))).toBe(false);
    });
    it('el encargado no gestiona a otros encargados ni al master', () => {
        expect(puedeGestionar({ rol: 'ADMIN', sucursalId: 2 }, { rol: 'ADMIN', sucursalId: 2 })).toBe(false);
        expect(puedeGestionar({ rol: 'ADMIN', sucursalId: 2 }, { rol: 'MASTER', sucursalId: null })).toBe(false);
    });
    it('un encargado sin sucursal no gestiona a nadie', () => {
        expect(puedeGestionar({ rol: 'ADMIN', sucursalId: null }, empleado(null))).toBe(false);
    });
    it('el empleado no gestiona a nadie', () => {
        expect(puedeGestionar({ rol: 'EMPLEADO', sucursalId: 2 }, empleado(2))).toBe(false);
    });
});
