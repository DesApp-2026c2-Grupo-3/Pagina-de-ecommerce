'use strict';

// Ventas simuladas para la demo de Reportes (opcional: correr DESPUÉS de 20261020000000-catalogo-definitivo).
//  - 40 clientes demo (demo01@demo.burgerfast … demo40@demo.burgerfast, contraseña: demo1234), cada uno con su
//    dirección cerca de una sucursal.
//  - Pedidos de los últimos DIAS días en las sucursales activas, con volúmenes distintos por sucursal, picos al
//    mediodía y a la noche, más pedidos el fin de semana, y productos más y menos populares.
//  - Cada pedido con su detalle (tamaño, combo con su opción incluida, algún extra) y su historial de estados.
//    ~92 % entregados, ~8 % cancelados. Hoy quedan algunos en curso para mostrar el panel de pedidos.
//  - Algunos insumos quedan sin stock en una sucursal, para que el reporte "Sin stock" tenga datos.
// Es reproducible (siempre genera lo mismo) y el down borra todo lo que creó.
// Las ventas NO descuentan stock (la demo en vivo arranca con el stock completo).

const bcrypt = require('bcrypt');

const DIAS = 60;
const CLIENTES = 40;
const DOMINIO = '@demo.burgerfast';

// Insumos que quedan en 0 en una sucursal (se restauran en el down)
const SIN_STOCK = [
  { insumo: 'Queso azul', sucursal: 'BurgerFast Morón' },
  { insumo: 'Champiñones salteados', sucursal: 'BurgerFast Belgrano' },
  { insumo: 'Palta', sucursal: 'BurgerFast Microcentro' },
];

const NOMBRES = ['Lucía', 'Martín', 'Sofía', 'Juan', 'Valentina', 'Tomás', 'Camila', 'Facundo', 'Julieta', 'Nicolás',
  'Agustina', 'Matías', 'Florencia', 'Gonzalo', 'Micaela', 'Lautaro', 'Carolina', 'Federico', 'Rocío', 'Ezequiel'];
const APELLIDOS = ['González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Pérez', 'Gómez', 'Díaz', 'Romero',
  'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Benítez', 'Acosta'];
const OBSERVACIONES = ['Sin sal en las papas, por favor', 'La hamburguesa bien cocida', 'Cortar al medio',
  'Sin cebolla', 'Mandar servilletas extra', 'Salsas aparte'];

// Generador pseudoaleatorio con semilla fija: siempre los mismos datos
function crearAzar(semilla) {
  let a = semilla >>> 0;
  const azar = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const entre = (min, max) => min + Math.floor(azar() * (max - min + 1));
  const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
  const ponderado = (lista, peso) => {
    const total = lista.reduce((s, x) => s + peso(x), 0);
    let r = azar() * total;
    for (const x of lista) {
      r -= peso(x);
      if (r <= 0) return x;
    }
    return lista[lista.length - 1];
  };
  return { azar, entre, elegir, ponderado };
}

// Cuántos pedidos entran en cada hora del día (picos de mediodía y noche)
const PESO_HORA = { 9: 1, 10: 2, 11: 3, 12: 8, 13: 9, 14: 5, 15: 2, 16: 2, 17: 3, 18: 4, 19: 6, 20: 9, 21: 10, 22: 7 };

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    const { azar, entre, elegir, ponderado } = crearAzar(20261020);

    await sequelize.transaction(async (transaction) => {
      const q = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, transaction }))[0];

      const [{ ya }] = await q(`SELECT COUNT(*)::int AS ya FROM "Usuarios" WHERE email LIKE :dominio`, { dominio: `%${DOMINIO}` });
      if (ya > 0) {
        console.log('ℹ️  Las ventas demo ya estaban cargadas: no se hace nada.');
        return;
      }

      // ---------- Catálogo actual ----------
      const sucursales = await q('SELECT id, nombre, latitud, longitud, localidad, provincia FROM "Sucursals" WHERE activa = true ORDER BY id');
      if (sucursales.length === 0) throw new Error('No hay sucursales: corré antes la semilla del catálogo');
      const productos = await q(`
        SELECT p.id, p.nombre, p.precio, c.nombre AS categoria
        FROM "Productos" p JOIN "Categoria" c ON c.id = p."categoriaId"
        WHERE p."deletedAt" IS NULL AND p.disponible = true`);
      const tamanios = await q('SELECT "productoId", "tamanioId", precio FROM "ProductoTamanios" ORDER BY "tamanioId"');
      const grupos = await q('SELECT id, "productoId", "productoIncluidoId" FROM "ComboGrupos" ORDER BY orden');
      const extras = await q(`
        SELECT r."productoId", r."insumoId", r."cantidadBase", i."precioComercial"
        FROM "RecetaInsumos" r JOIN "Insumos" i ON i.id = r."insumoId"
        WHERE r."esAgregable" = true AND i."precioComercial" IS NOT NULL`);

      const tamaniosDe = (id) => tamanios.filter((t) => t.productoId === id);
      const gruposDe = (id) => grupos.filter((g) => g.productoId === id);
      const extrasDe = (id) => extras.filter((e) => e.productoId === id);

      // Popularidad: combos y hamburguesas arriba, cafetería abajo, y cada producto con su "suerte"
      const BASE = { Combos: 6, Hamburguesas: 5, 'Papas Fritas': 4, Bebidas: 3, Nuggets: 2, Café: 1.2, 'Menú Café': 1 };
      for (const p of productos) p.peso = (BASE[p.categoria] ?? 1) * (0.15 + azar() ** 2 * 2);

      // Volumen distinto por sucursal
      for (const s of sucursales) s.volumen = 0.5 + azar() * 1.2;

      // ---------- Clientes demo, con dirección cerca de una sucursal ----------
      const password = bcrypt.hashSync('demo1234', 10);
      const clientes = [];
      for (let n = 1; n <= CLIENTES; n++) {
        const sucursal = sucursales[(n - 1) % sucursales.length];
        const nombre = elegir(NOMBRES);
        const apellido = elegir(APELLIDOS);
        const [usuario] = await q(
          `INSERT INTO "Usuarios" (nombre, apellido, email, password, telefono, "sucursalId", "createdAt", "updatedAt")
           VALUES (:nombre, :apellido, :email, :password, :telefono, :sucursalId, NOW(), NOW()) RETURNING id`,
          {
            nombre, apellido, password,
            email: `demo${String(n).padStart(2, '0')}${DOMINIO}`,
            telefono: `11-${entre(4000, 6999)}-${entre(1000, 9999)}`,
            sucursalId: sucursal.id,
          }
        );
        const [direccion] = await q(
          `INSERT INTO "Direccions" (alias, calle, numero, localidad, provincia, latitud, longitud, predeterminada, "usuarioId", "createdAt", "updatedAt")
           VALUES ('Casa', :calle, :numero, :localidad, :provincia, :latitud, :longitud, true, :usuarioId, NOW(), NOW()) RETURNING id`,
          {
            calle: elegir(['Av. Rivadavia', 'Belgrano', 'San Martín', 'Sarmiento', 'Mitre', 'Moreno', 'Alsina']),
            numero: String(entre(100, 4999)),
            localidad: sucursal.localidad,
            provincia: sucursal.provincia,
            // A menos de ~1,5 km de su sucursal
            latitud: Number(sucursal.latitud) + (azar() - 0.5) * 0.02,
            longitud: Number(sucursal.longitud) + (azar() - 0.5) * 0.02,
            usuarioId: usuario.id,
          }
        );
        clientes.push({ id: usuario.id, direccionId: direccion.id, sucursalId: sucursal.id });
      }

      // ---------- Pedidos ----------
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const ahora = Date.now();
      const minutos = (fecha, min) => new Date(fecha.getTime() + min * 60000);
      const horas = Object.keys(PESO_HORA).map(Number);
      let totalPedidos = 0;

      for (let d = DIAS; d >= 0; d--) {
        const dia = new Date(hoy.getTime() - d * 86400000);
        const finDeSemana = [0, 5, 6].includes(dia.getDay());

        for (const sucursal of sucursales) {
          const clientesSucursal = clientes.filter((c) => c.sucursalId === sucursal.id);
          if (clientesSucursal.length === 0) continue;
          const cantidad = Math.round((finDeSemana ? 6 : 4) * sucursal.volumen * (0.7 + azar() * 0.6));

          for (let k = 0; k < cantidad; k++) {
            const hora = ponderado(horas, (h) => PESO_HORA[h]);
            const fecha = new Date(dia);
            fecha.setHours(hora, entre(0, 59), entre(0, 59));
            if (fecha.getTime() > ahora) continue; // nada en el futuro

            // Estado final: hoy, lo más reciente puede seguir en curso
            const haceMin = (ahora - fecha.getTime()) / 60000;
            let estado;
            if (azar() < 0.08) estado = 'Cancelado';
            else if (haceMin < 15) estado = 'Pendiente';
            else if (haceMin < 30) estado = 'En proceso';
            else if (haceMin < 50) estado = 'En camino';
            else estado = 'Entregado';

            // Líneas: de 1 a 4 productos
            const lineas = [];
            const nLineas = ponderado([1, 2, 3, 4], (n) => [5, 4, 2, 1][n - 1]);
            for (let l = 0; l < nLineas; l++) {
              const producto = ponderado(productos, (p) => p.peso);
              const tams = tamaniosDe(producto.id);
              const tam = tams.length > 0 ? ponderado(tams, (t) => [5, 3, 1][tams.indexOf(t)] ?? 1) : null;
              let precio = Number(tam ? tam.precio : producto.precio);

              // Algún extra (1 porción) en ~15 % de las líneas que lo permiten
              const personalizaciones = [];
              const posibles = extrasDe(producto.id);
              if (posibles.length > 0 && azar() < 0.15) {
                const extra = elegir(posibles);
                const base = Number(extra.cantidadBase);
                personalizaciones.push({ insumoId: extra.insumoId, cantidad: base + 1 });
                precio += Number(extra.precioComercial);
              }

              // Combo: la opción incluida de cada lugar (a veces "sin bebida")
              const gs = gruposDe(producto.id);
              const combo = gs.length > 0
                ? {
                    elecciones: gs
                      .filter((g, i) => !(i === gs.length - 1 && azar() < 0.07))
                      .map((g) => ({ grupoId: g.id, productoId: g.productoIncluidoId, recargo: 0 })),
                    recargo: 0,
                  }
                : null;

              lineas.push({
                productoId: producto.id,
                cantidad: azar() < 0.85 ? 1 : 2,
                precio,
                tamanioId: tam ? tam.tamanioId : null,
                personalizaciones,
                combo,
              });
            }

            const cliente = elegir(clientesSucursal);
            const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
            const [pedido] = await q(
              `INSERT INTO "Pedidos" ("usuarioId", "direccionId", "sucursalId", fecha, total, estado, observaciones, "createdAt", "updatedAt")
               VALUES (:usuarioId, :direccionId, :sucursalId, :fecha, :total, :estado, :observaciones, :fecha, :fecha) RETURNING id`,
              {
                usuarioId: cliente.id, direccionId: cliente.direccionId, sucursalId: sucursal.id,
                fecha, total, estado,
                observaciones: azar() < 0.1 ? elegir(OBSERVACIONES) : null,
              }
            );

            await queryInterface.bulkInsert('DetallePedidos', lineas.map((l) => ({
              ...l,
              pedidoId: pedido.id,
              personalizaciones: JSON.stringify(l.personalizaciones),
              combo: l.combo ? JSON.stringify(l.combo) : null,
              createdAt: fecha,
              updatedAt: fecha,
            })), { transaction });

            // Historial: los mismos pasos que hace el admin, con tiempos creíbles
            const pasos = [{ estado: 'pendiente', anterior: null, fecha }];
            if (estado === 'Cancelado') {
              pasos.push({ estado: 'Cancelado', anterior: 'pendiente', fecha: minutos(fecha, entre(2, 10)) });
            } else {
              const cadena = ['En proceso', 'En camino', 'Entregado'];
              const hasta = cadena.indexOf(estado) + 1;
              let t = fecha;
              let anterior = 'pendiente';
              for (const [i, e] of cadena.slice(0, hasta).entries()) {
                t = minutos(t, [entre(3, 8), entre(12, 22), entre(15, 30)][i]);
                pasos.push({ estado: e, anterior, fecha: t });
                anterior = e;
              }
            }
            await queryInterface.bulkInsert('historialDeTiemposPedido', pasos.map((p) => ({
              pedidoId: pedido.id, estado: p.estado, estadoAnterior: p.anterior, fecha: p.fecha,
              createdAt: p.fecha,
            })), { transaction });

            totalPedidos++;
          }
        }
      }

      // ---------- Algunos insumos sin stock ----------
      for (const s of SIN_STOCK) {
        await q(
          `UPDATE "StockSucursals" SET cantidad = 0, "updatedAt" = NOW()
            WHERE "insumoId" = (SELECT id FROM "Insumos" WHERE nombre = :insumo)
              AND "sucursalId" = (SELECT id FROM "Sucursals" WHERE nombre = :sucursal)`,
          s
        );
      }

      console.log(`✅ Ventas demo: ${CLIENTES} clientes y ${totalPedidos} pedidos en ${DIAS + 1} días.`);
    });
  },

  // Borra los clientes demo: sus pedidos, detalles, historial y direcciones se van en cascada.
  // El stock que quedó en 0 vuelve a un valor normal.
  async down(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      const q = (sql, replacements) => sequelize.query(sql, { replacements, transaction });
      await q('DELETE FROM "Pedidos" WHERE "usuarioId" IN (SELECT id FROM "Usuarios" WHERE email LIKE :d)', { d: `%${DOMINIO}` });
      await q('DELETE FROM "Direccions" WHERE "usuarioId" IN (SELECT id FROM "Usuarios" WHERE email LIKE :d)', { d: `%${DOMINIO}` });
      await q('DELETE FROM "Usuarios" WHERE email LIKE :d', { d: `%${DOMINIO}` });
      for (const s of SIN_STOCK) {
        await q(
          `UPDATE "StockSucursals" SET cantidad = GREATEST(cantidad, 150), "updatedAt" = NOW()
            WHERE "insumoId" = (SELECT id FROM "Insumos" WHERE nombre = :insumo)
              AND "sucursalId" = (SELECT id FROM "Sucursals" WHERE nombre = :sucursal)`,
          s
        );
      }
    });
  },
};