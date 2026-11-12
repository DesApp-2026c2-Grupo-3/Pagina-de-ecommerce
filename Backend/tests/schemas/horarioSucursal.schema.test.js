const { horarioSucursalSchema, permisoHorarioSchema } = require('../../src/schemas/admin/sucursal.schema');
const { DIAS_SEMANA } = require('../../src/utils/horarioSucursal');

const mensajeDe = (schema, datos) => schema.validate(datos).error?.details[0].message;

const dia = (apertura = '09:00', cierre = '23:00', extra = {}) => ({ abierto: true, apertura, cierre, ...extra });
const horarioValido = () => Object.fromEntries(DIAS_SEMANA.map((d) => [d, dia()]));

describe('horarioSucursalSchema (lo que guarda el encargado desde Mi sucursal)', () => {
    it('acepta un horario con los siete días', () => {
        expect(horarioSucursalSchema.validate({ horario: horarioValido() }).error).toBeUndefined();
    });

    it('acepta un día cerrado y un día con transnoche', () => {
        const horario = horarioValido();
        horario.domingo = { abierto: false, apertura: '09:00', cierre: '23:00' };
        horario.viernes = dia('18:00', '23:59', { transnocheMin: 150 });
        expect(horarioSucursalSchema.validate({ horario }).error).toBeUndefined();
    });

    it('exige el horario', () => {
        expect(horarioSucursalSchema.validate({}).error).toBeDefined();
    });

    it('rechaza un día sin cargar', () => {
        const horario = horarioValido();
        delete horario.lunes;
        expect(mensajeDe(horarioSucursalSchema, { horario })).toBe('Completá el horario del lunes');
    });

    it('rechaza una hora con formato inválido', () => {
        const horario = horarioValido();
        horario.lunes.apertura = '9am';
        expect(mensajeDe(horarioSucursalSchema, { horario })).toBe('Las horas del lunes van de 00:00 a 23:59 (formato HH:MM)');
    });

    it('rechaza una transnoche mayor al tope', () => {
        const horario = horarioValido();
        horario.lunes = dia('18:00', '23:59', { transnocheMin: 361 });
        expect(mensajeDe(horarioSucursalSchema, { horario })).toBe('La transnoche del lunes puede llegar hasta +06:00');
    });

    it('rechaza el formato de turnos', () => {
        const horario = horarioValido();
        horario.lunes = { abierto: true, turnos: [{ apertura: '09:00', cierre: '23:00', cruzaMedianoche: false }] };
        expect(horarioSucursalSchema.validate({ horario }).error).toBeDefined();
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
