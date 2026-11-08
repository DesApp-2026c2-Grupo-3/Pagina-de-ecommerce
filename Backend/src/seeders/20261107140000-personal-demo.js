'use strict';
const bcrypt = require('bcrypt');

// Personal de demo: 2 encargados (ADMIN) y 2 empleados por sucursal.
// Contraseña común de todos: Burger1234. El master lo crea el seeder del catálogo.
// Idempotente: solo inserta a quienes todavía no existen (por email).
const PASSWORD_DEMO = 'Burger1234';

const PERSONAL = {
  'BurgerFast Hurlingham': { encargados: ['Lucía Fernández', 'Martín Acosta'], empleados: ['Camila Romero', 'Joaquín Benítez'] },
  'BurgerFast Morón': { encargados: ['Valentina Gómez', 'Nicolás Herrera'], empleados: ['Julieta Sosa', 'Matías Ledesma'] },
  'BurgerFast El Palomar': { encargados: ['Florencia Díaz', 'Sebastián Torres'], empleados: ['Agustina Ruiz', 'Federico Maldonado'] },
  'BurgerFast Ramos Mejía': { encargados: ['Carolina Medina', 'Gonzalo Peralta'], empleados: ['Micaela Cabrera', 'Tomás Ortiz'] },
  'BurgerFast San Miguel': { encargados: ['Daniela Rojas', 'Maximiliano Vega'], empleados: ['Antonella Silva', 'Franco Giménez'] },
  'BurgerFast Muñiz': { encargados: ['Paula Navarro', 'Leandro Domínguez'], empleados: ['Rocío Aguirre', 'Ezequiel Castro'] },
  'BurgerFast Belgrano': { encargados: ['Mariana López', 'Andrés Villalba'], empleados: ['Sofía Paz', 'Lautaro Ríos'] },
  'BurgerFast Microcentro': { encargados: ['Natalia Suárez', 'Diego Molina'], empleados: ['Belén Correa', 'Ignacio Funes'] },
};

// "Lucía Fernández" → lucia.fernandez@burgerfast.com
const emailDe = (nombre) =>
  nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '.') + '@burgerfast.com';

const todos = () =>
  Object.entries(PERSONAL).flatMap(([sucursal, g]) => [
    ...g.encargados.map((nombre) => ({ sucursal, nombre, rol: 'ADMIN' })),
    ...g.empleados.map((nombre) => ({ sucursal, nombre, rol: 'EMPLEADO' })),
  ]);

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    const t = await sequelize.transaction();
    try {
      const [sucursales] = await sequelize.query('SELECT id, nombre FROM "Sucursals"', { transaction: t });
      const idPorNombre = Object.fromEntries(sucursales.map((s) => [s.nombre, s.id]));

      const [existentes] = await sequelize.query('SELECT email FROM "Admins"', { transaction: t });
      const yaEstan = new Set(existentes.map((a) => a.email));

      const password = await bcrypt.hash(PASSWORD_DEMO, 10);
      const ahora = new Date();
      const filas = [];
      for (const p of todos()) {
        const sucursalId = idPorNombre[p.sucursal];
        if (!sucursalId) throw new Error(`Falta la sucursal "${p.sucursal}": corré antes el seeder del catálogo`);
        const email = emailDe(p.nombre);
        if (yaEstan.has(email)) continue;
        filas.push({ nombre: p.nombre, email, password, rol: p.rol, sucursalId, activo: true, createdAt: ahora, updatedAt: ahora });
      }

      if (filas.length) await queryInterface.bulkInsert('Admins', filas, { transaction: t });
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Admins', { email: todos().map((p) => emailDe(p.nombre)) });
  },
};
