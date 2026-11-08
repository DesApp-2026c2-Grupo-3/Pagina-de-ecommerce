const { horarioSucursalSchema, permisoHorarioSchema } = require('../../src/schemas/admin/sucursal.schema');
const { DIAS_SEMANA } = require('../../src/utils/horarioSucursal');

const mensajeDe = (schema, datos) => schema.validate(datos).error?.details[0].message;

const horarioValido = () =>
    Object.fromEntries(DIAS_SEMANA.map((dia) => [dia, { apertura: '09:00', cierre: '23:00', abierto: true }]));

describe('horarioSucursalSchema', () => {
    it('acepta un horario con los siete días', () => {
        expect(horarioSucursalSchema.validate({ horario: horarioValido() }).error).toBeUndefined();
    });

    it('exige el horario', () => {
        expect(horarioSucursalSchema.validate({}).error).toBeDefined();
    });

    it('rechaza un día sin cargar', () => {
        const horario = horarioValido();
        delete horario[DIAS_SEMANA[0]];
        expect(horarioSucursalSchema.validate({ horario }).error).toBeDefined();
    });

    it('rechaza una hora con formato inválido', () => {
        const horario = horarioValido();
        horario[DIAS_SEMANA[0]].apertura = '9am';
        expect(mensajeDe(horarioSucursalSchema, { horario })).toBe('La apertura debe tener formato HH:MM (ej: "09:00")');
    });

    it('no admite otros datos de la sucursal junto al horario', () => {
        expect(horarioSucursalSchema.validate({ horario: horarioValido(), nombre: 'Otra' }).error).toBeDefined();
    });
});

describe('permisoHorarioSchema', () => {
    it.each([true, false])('acepta %s', (valor) => {
        expect(permisoHorarioSchema.validate({ encargadoEditaHorario: valor }).error).toBeUndefined();
    });

    it('es obligatorio', () => {
        expect(mensajeDe(permisoHorarioSchema, {})).toBe('Indicá si los encargados pueden editar el horario');
    });

    it.each(['true', 1, null])('rechaza %p (tiene que ser un booleano)', (valor) => {
        expect(permisoHorarioSchema.validate({ encargadoEditaHorario: valor }).error).toBeDefined();
    });
});
