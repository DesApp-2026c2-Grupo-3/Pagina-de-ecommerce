'use strict';
// Repartidores, viajes y calificaciones para la presentación.
// Corre DESPUÉS de 20261107130000-ventas-historia (usa sus pedidos y sus tiempos).
//
// Qué genera (siempre lo mismo, porque usa una semilla fija):
//  - 3 repartidores por sucursal (contraseña: demo1234). El de Morón para la demo es
//    lucas.gomez@burgerfast.com.ar.
//  - Viajes de los últimos 30 días: cada pedido entregado sale en un viaje, solo o junto con
//    otro que salió casi a la misma hora (máximo 2, como el parámetro maxPedidosEnCurso).
//    Los tiempos salen del historial del pedido (cuándo salió y cuándo se entregó).
//  - Los pedidos "En camino" de ahora quedan en viajes activos. Uno de otra sucursal (no Morón,
//    así el repartidor de la demo tiene un viaje normal) queda "requiere asistencia"
//    (rueda pinchada) para mostrar la reasignación desde el panel.
//  - Calificaciones de los últimos 90 días (~1 de cada 5 pedidos entregados): el puntaje
//    depende de cuánto tardó el pedido. Las de los últimos 4 días quedan PENDIENTES para
//    moderarlas en vivo; unas pocas con comentarios fuera de lugar quedan OCULTAS.
//    Los pedidos de los últimos 2 días quedan sin calificar, para calificar en la demo.
// Si los repartidores ya están cargados, no hace nada. El down borra todo lo que creó.
const bcrypt = require('bcrypt');

const DOMINIO = '@burgerfast.com.ar';
const DIAS_DE_VIAJES = 30;
const DIAS_DE_CALIFICACIONES = 90;
const DIAS_PENDIENTES = 4;
const DIAS_SIN_CALIFICAR = 2;
const PROBABILIDAD_CALIFICAR = 0.2;
const MAXIMO_POR_VIAJE = 2;
const JUNTOS_SI_SALEN_EN_MIN = 12; // dos pedidos que salen con menos de esto pueden ir juntos

// Tres repartidores por sucursal, en el orden de la sucursal (por id)
const REPARTIDORES = {
  'BurgerFast Hurlingham': [['Martina', 'Sosa'], ['Diego', 'Ferreyra'], ['Camila', 'Ríos']],
  'BurgerFast Morón': [['Lucas', 'Gómez'], ['Sofía', 'Benítez'], ['Matías', 'Acosta']],
  'BurgerFast El Palomar': [['Julián', 'Medina'], ['Valentina', 'Rojas'], ['Tomás', 'Herrera']],
  'BurgerFast Ramos Mejía': [['Agustina', 'Luna'], ['Nicolás', 'Castro'], ['Florencia', 'Vega']],
  'BurgerFast San Miguel': [['Facundo', 'Molina'], ['Micaela', 'Romero'], ['Bruno', 'Suárez']],
  'BurgerFast Muñiz': [['Lautaro', 'Díaz'], ['Carolina', 'Paz'], ['Gonzalo', 'Ortiz']],
  'BurgerFast Belgrano': [['Joaquín', 'Silva'], ['Paula', 'Navarro'], ['Ezequiel', 'Torres']],
  'BurgerFast Microcentro': [['Santiago', 'Ruiz'], ['Lucía', 'Morales'], ['Franco', 'Giménez']],
};
const SUCURSAL_DE_LA_DEMO = 'BurgerFast Morón';
const NOMBRES_DE_REPUESTO = [['Ramiro', 'Peralta'], ['Abril', 'Quiroga'], ['Iván', 'Cabrera']];

// Comentarios según el puntaje
const COMENTARIOS = {
  5: [
    'Llegó rapidísimo y bien caliente. ¡Excelente!',
    'La mejor hamburguesa de la zona, como siempre.',
    'Impecable: el pedido completo y el repartidor re amable.',
    'Las papas llegaron crocantes, eso no pasa en ningún lado.',
    'Pedí para toda la familia y no faltó nada. Gracias.',
    'El combo Habemus es una locura. Volvemos a pedir seguro.',
    'Súper rápido, menos de lo que decía la app.',
    'Diez puntos. El repartidor avisó al llegar y todo perfecto.',
    'Siempre cumplen. La salsa de la casa es lo más.',
    'Riquísima y abundante, quedamos re llenos.',
  ],
  4: [
    'Muy rica, solo tardó un poquito más de lo esperado.',
    'Todo bien, las papas podrían venir con más sal.',
    'Buena atención y buen tamaño. Recomendable.',
    'Rico como siempre, le faltaron servilletas.',
    'Llegó bien, la bebida un poco tibia.',
    'Muy buena la promo del día, la vamos a repetir.',
    'Rico, aunque el pan llegó un poco aplastado.',
  ],
  3: [
    'Estaba bien, pero llegó tibia.',
    'Normal. Tardó bastante para ser un martes.',
    'La hamburguesa bien, las papas un poco blandas.',
    'Faltó el aderezo que pedí aparte.',
  ],
  2: [
    'Tardó casi una hora y llegó fría.',
    'Me mandaron la bebida equivocada.',
    'La hamburguesa vino desarmada, una lástima.',
  ],
  1: [
    'Más de una hora de espera y llegó todo frío.',
    'Faltaron las papas del combo y nadie respondió.',
  ],
};
// Comentarios fuera de lugar: el admin los oculta
const COMENTARIOS_OCULTOS = [
  'Compren en otro lado, son todos unos chantas!!!',
  'Sigan mi cuenta de ig para sorteos @promosgratis',
  'El repartidor es un inútil, que lo echen.',
];

// Azar con semilla fija (siempre da lo mismo)
function crearAzar(semilla) {
  let s = semilla >>> 0;
  const azar = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const entre = (min, max) => min + Math.floor(azar() * (max - min + 1));
  const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
  return { azar, entre, elegir };
}

const minutos = (fecha, cantidad) => new Date(new Date(fecha).getTime() + cantidad * 60000);

// "Gómez" -> "gomez" para el email
const sinTildes = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function insertarPorLotes(queryInterface, tabla, filas, transaction, tamanio = 500) {
  for (let i = 0; i < filas.length; i += tamanio) {
    await queryInterface.bulkInsert(tabla, filas.slice(i, i + tamanio), { transaction });
  }
}

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    const { azar, entre, elegir } = crearAzar(20261123);
    const ahora = new Date();

    await sequelize.transaction(async (transaction) => {
      const q = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, transaction }))[0];

      const [{ ya }] = await q('SELECT COUNT(*)::int AS ya FROM "Repartidors" WHERE email LIKE :d', { d: `%${DOMINIO}` });
      if (ya > 0) return; // ya estaba cargada

      // ---------- 1. Repartidores ----------
      const sucursales = await q('SELECT id, nombre, latitud, longitud FROM "Sucursals" ORDER BY id');
      if (sucursales.length === 0) throw new Error('No hay sucursales: corré antes la semilla del catálogo');

      const password = bcrypt.hashSync('demo1234', 10);
      const usados = new Set();
      const filasRepartidores = [];
      for (const sucursal of sucursales) {
        const nombres = REPARTIDORES[sucursal.nombre] ?? NOMBRES_DE_REPUESTO;
        for (const [nombre, apellido] of nombres) {
          let email = `${sinTildes(nombre)}.${sinTildes(apellido)}${DOMINIO}`;
          if (usados.has(email)) email = `${sinTildes(nombre)}.${sinTildes(apellido)}.${sucursal.id}${DOMINIO}`;
          usados.add(email);
          filasRepartidores.push({
            nombre, apellido, email, password, sucursalId: sucursal.id, activo: true,
            createdAt: minutos(ahora, -60 * 24 * (DIAS_DE_VIAJES + 15)),
            updatedAt: ahora,
          });
        }
      }
      await queryInterface.bulkInsert('Repartidors', filasRepartidores, { transaction });
      const repartidores = await q(
        'SELECT id, "sucursalId" FROM "Repartidors" WHERE email LIKE :d ORDER BY id',
        { d: `%${DOMINIO}` }
      );
      const repartidoresDe = new Map();
      for (const r of repartidores) {
        if (!repartidoresDe.has(r.sucursalId)) repartidoresDe.set(r.sucursalId, []);
        repartidoresDe.get(r.sucursalId).push({ id: r.id, libreDesde: 0 });
      }

      // ---------- 2. Viajes terminados (últimos 30 días) ----------
      // Cuándo salió y cuándo se entregó cada pedido, según su historial
      const entregados = await q(`
        SELECT p.id, p."sucursalId",
               MAX(h.fecha) FILTER (WHERE h.estado ILIKE 'en camino') AS salida,
               MAX(h.fecha) FILTER (WHERE h.estado ILIKE 'entregado') AS entrega
        FROM "Pedidos" p
        JOIN "historialDeTiemposPedido" h ON h."pedidoId" = p.id
        WHERE p.estado ILIKE 'entregado' AND p."viajeId" IS NULL
          AND p."direccionId" IS NOT NULL AND p."sucursalId" IS NOT NULL
          AND p.fecha >= NOW() - (:dias || ' days')::interval
        GROUP BY p.id
        HAVING MAX(h.fecha) FILTER (WHERE h.estado ILIKE 'en camino') IS NOT NULL
           AND MAX(h.fecha) FILTER (WHERE h.estado ILIKE 'entregado') IS NOT NULL
        ORDER BY p."sucursalId", salida`,
        { dias: String(DIAS_DE_VIAJES) }
      );

      // Se arman los viajes: un pedido, o dos si salieron casi juntos
      const viajes = []; // { repartidorId, fechaInicio, fechaFin, pedidos: [{ id, retiradoEn }] }
      for (let i = 0; i < entregados.length; ) {
        const primero = entregados[i];
        const grupo = [primero];
        while (
          grupo.length < MAXIMO_POR_VIAJE &&
          i + grupo.length < entregados.length &&
          entregados[i + grupo.length].sucursalId === primero.sucursalId &&
          new Date(entregados[i + grupo.length].salida) - new Date(primero.salida) <= JUNTOS_SI_SALEN_EN_MIN * 60000 &&
          azar() < 0.6
        ) {
          grupo.push(entregados[i + grupo.length]);
        }
        i += grupo.length;

        const fechaInicio = new Date(Math.min(...grupo.map((p) => new Date(p.salida).getTime())));
        const fechaFin = new Date(Math.max(...grupo.map((p) => new Date(p.entrega).getTime())));

        // Lo lleva un repartidor que esté libre; si están todos en la calle, el que vuelve antes
        const plantel = repartidoresDe.get(primero.sucursalId);
        if (!plantel) continue;
        const libres = plantel.filter((r) => r.libreDesde <= fechaInicio.getTime());
        const repartidor = libres.length > 0
          ? elegir(libres)
          : plantel.reduce((a, b) => (a.libreDesde <= b.libreDesde ? a : b));
        repartidor.libreDesde = fechaFin.getTime() + entre(3, 10) * 60000; // vuelve al local

        viajes.push({
          repartidorId: repartidor.id,
          fechaInicio,
          fechaFin,
          estado: 'finalizado',
          pedidos: grupo.map((p) => ({ id: p.id, retiradoEn: minutos(fechaInicio, -entre(1, 4)) })),
        });
      }

      // ---------- 3. Viajes en curso (los pedidos "En camino" de ahora) ----------
      const enCamino = await q(`
        SELECT p.id, p."sucursalId", s.nombre AS sucursal, s.latitud, s.longitud,
               MAX(h.fecha) FILTER (WHERE h.estado ILIKE 'en camino') AS salida
        FROM "Pedidos" p
        JOIN "Sucursals" s ON s.id = p."sucursalId"
        LEFT JOIN "historialDeTiemposPedido" h ON h."pedidoId" = p.id
        WHERE p.estado ILIKE 'en camino' AND p."viajeId" IS NULL
        GROUP BY p.id, s.id
        ORDER BY p.id`);

      const conAsistencia = Math.max(0, enCamino.findIndex((p) => p.sucursal !== SUCURSAL_DE_LA_DEMO));
      const ocupados = new Set();
      enCamino.forEach((pedido, indice) => {
        const plantel = repartidoresDe.get(pedido.sucursalId) ?? [];
        const repartidor = plantel.find((r) => !ocupados.has(r.id));
        if (!repartidor) return; // un repartidor no puede tener dos viajes en curso
        ocupados.add(repartidor.id);

        const fechaInicio = pedido.salida ? new Date(pedido.salida) : minutos(ahora, -entre(8, 15));
        const asistencia = indice === conAsistencia;
        viajes.push({
          repartidorId: repartidor.id,
          fechaInicio,
          fechaFin: null,
          estado: asistencia ? 'requiere asistencia' : 'activo',
          ...(asistencia && {
            motivoAsistencia: 'Problema con el vehículo',
            comentarioAsistencia: 'Se me pinchó la rueda de la moto a dos cuadras del cliente.',
            fechaSolicitudAsistencia: minutos(ahora, -4),
            latitudAsistencia: (Number(pedido.latitud) + 0.004).toFixed(7),
            longitudAsistencia: (Number(pedido.longitud) - 0.003).toFixed(7),
          }),
          pedidos: [{ id: pedido.id, retiradoEn: minutos(fechaInicio, -2) }],
        });
      });

      // Se guardan los viajes y se anotan en sus pedidos
      const filasViajes = viajes.map((v) => ({
        repartidorId: v.repartidorId,
        fechaInicio: v.fechaInicio,
        fechaFin: v.fechaFin,
        estado: v.estado,
        motivoAsistencia: v.motivoAsistencia ?? null,
        comentarioAsistencia: v.comentarioAsistencia ?? null,
        fechaSolicitudAsistencia: v.fechaSolicitudAsistencia ?? null,
        latitudAsistencia: v.latitudAsistencia ?? null,
        longitudAsistencia: v.longitudAsistencia ?? null,
        recepcionConfirmada: true,
        createdAt: v.fechaInicio,
        updatedAt: v.fechaFin ?? ahora,
      }));
      await insertarPorLotes(queryInterface, 'Viajes', filasViajes, transaction);

      // Los ids salen en el mismo orden en que se insertaron
      const ids = await q(
        `SELECT v.id FROM "Viajes" v JOIN "Repartidors" r ON r.id = v."repartidorId"
          WHERE r.email LIKE :d ORDER BY v.id`,
        { d: `%${DOMINIO}` }
      );
      const asignaciones = [];
      viajes.forEach((v, i) => {
        for (const p of v.pedidos) asignaciones.push({ pedidoId: p.id, viajeId: ids[i].id, retiradoEn: p.retiradoEn });
      });
      for (let i = 0; i < asignaciones.length; i += 500) {
        const lote = asignaciones.slice(i, i + 500);
        const valores = lote.map((_, j) => `(:p${j}::int, :v${j}::int, :r${j}::timestamptz)`).join(', ');
        const reemplazos = {};
        lote.forEach((a, j) => {
          reemplazos[`p${j}`] = a.pedidoId;
          reemplazos[`v${j}`] = a.viajeId;
          reemplazos[`r${j}`] = a.retiradoEn.toISOString();
        });
        await q(
          `UPDATE "Pedidos" AS p SET "viajeId" = x.v, "retiradoEn" = x.r
             FROM (VALUES ${valores}) AS x(p, v, r) WHERE p.id = x.p`,
          reemplazos
        );
      }

      // ---------- 4. Calificaciones ----------
      const candidatos = await q(`
        SELECT p.id, p."usuarioId", p."sucursalId", p.fecha,
               MAX(h.fecha) FILTER (WHERE h.estado ILIKE 'entregado') AS entrega
        FROM "Pedidos" p
        LEFT JOIN "historialDeTiemposPedido" h ON h."pedidoId" = p.id
        WHERE p.estado ILIKE 'entregado' AND p."usuarioId" IS NOT NULL
          AND p.fecha >= NOW() - (:desde || ' days')::interval
          AND p.fecha <  NOW() - (:hasta || ' days')::interval
          AND NOT EXISTS (SELECT 1 FROM "Calificaciones" c WHERE c."pedidoId" = p.id)
        GROUP BY p.id
        ORDER BY p.id`,
        { desde: String(DIAS_DE_CALIFICACIONES), hasta: String(DIAS_SIN_CALIFICAR) }
      );

      const limitePendiente = minutos(ahora, -DIAS_PENDIENTES * 24 * 60).getTime();
      const filasCalificaciones = [];
      for (const pedido of candidatos) {
        if (azar() >= PROBABILIDAD_CALIFICAR) continue;

        // Cuanto más tardó, peor puntaje
        const entrega = pedido.entrega ? new Date(pedido.entrega) : minutos(pedido.fecha, 40);
        const demora = (entrega - new Date(pedido.fecha)) / 60000;
        const tirada = azar();
        let puntaje;
        if (demora <= 35) puntaje = tirada < 0.65 ? 5 : tirada < 0.93 ? 4 : 3;
        else if (demora <= 50) puntaje = tirada < 0.3 ? 5 : tirada < 0.7 ? 4 : tirada < 0.92 ? 3 : 2;
        else puntaje = tirada < 0.15 ? 4 : tirada < 0.45 ? 3 : tirada < 0.8 ? 2 : 1;

        const creada = new Date(Math.min(minutos(entrega, entre(10, 600)).getTime(), ahora.getTime()));
        const pendiente = creada.getTime() >= limitePendiente;

        // Unas pocas, con comentarios fuera de lugar, ya las ocultó el admin
        // (las pendientes también pueden tener uno, para ocultarlo en vivo)
        const fueraDeLugar = puntaje <= 2 && azar() < 0.25;
        const comentario = fueraDeLugar
          ? elegir(COMENTARIOS_OCULTOS)
          : azar() < 0.65 ? elegir(COMENTARIOS[puntaje]) : null;
        const estado = pendiente ? 'PENDIENTE' : fueraDeLugar ? 'OCULTA' : 'APROBADA';

        filasCalificaciones.push({
          pedidoId: pedido.id,
          usuarioId: pedido.usuarioId,
          sucursalId: pedido.sucursalId,
          puntaje,
          comentario,
          estado,
          createdAt: creada,
          updatedAt: creada,
        });
      }
      await insertarPorLotes(queryInterface, 'Calificaciones', filasCalificaciones, transaction);
    });
  },

  // Borra los repartidores de la semilla con sus viajes (los pedidos quedan sin viaje)
  // y las calificaciones de los clientes de la historia de ventas.
  async down(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      const q = (sql, replacements) => sequelize.query(sql, { replacements, transaction });
      const d = `%${DOMINIO}`;
      const viajesDeLaSemilla =
        'SELECT v.id FROM "Viajes" v JOIN "Repartidors" r ON r.id = v."repartidorId" WHERE r.email LIKE :d';
      await q(`UPDATE "Pedidos" SET "viajeId" = NULL, "retiradoEn" = NULL WHERE "viajeId" IN (${viajesDeLaSemilla})`, { d });
      await q(`DELETE FROM "Viajes" WHERE id IN (${viajesDeLaSemilla})`, { d });
      await q('DELETE FROM "Repartidors" WHERE email LIKE :d', { d });
      await q(
        `DELETE FROM "Calificaciones" WHERE "usuarioId" IN
           (SELECT id FROM "Usuarios" WHERE email LIKE '%@historia.burgerfast')`
      );
    });
  },
};
