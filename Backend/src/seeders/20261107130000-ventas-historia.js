'use strict';

// Historia de ventas para los Reportes (reemplaza a la vieja 20261020010000-ventas-demo).
// Corre DESPUÉS del catálogo y de las promociones iniciales.
//
// Qué genera (siempre lo mismo, porque usa una semilla fija):
//  - 14 meses de pedidos, con el negocio creciendo: los primeros meses tienen menos pedidos.
//  - 8 sucursales con personalidad propia: volumen, tendencia (unas crecen y otras caen),
//    velocidad de entrega y producto favorito.
//  - ~650 clientes (cliente001@historia.burgerfast … contraseña: demo1234): fieles, regulares
//    y ocasionales, cada uno con su producto preferido. Llegan a lo largo del tiempo, con un mes
//    y una semana de "campaña", y algunos dejan de pedir (hace ~40, ~70 y ~110 días, y otros antes).
//  - Picos de mediodía y noche, más pedidos el fin de semana, días "de lluvia" con mucho movimiento
//    y algunos días malos con muchas cancelaciones.
//  - En los últimos 4 meses, ~35 % de los pedidos usan una promo válida ese día (las del día solo
//    en su día; el regalo solo con la compra mínima), con promocionId y precioLista guardados.
//  - Ahora mismo quedan pedidos Pendientes, En proceso y En camino.
//  - Algunos insumos quedan sin stock en una sucursal.
// Antes de cargar, borra lo que haya dejado la vieja semilla de ventas demo (@demo.burgerfast).
// Las ventas NO descuentan stock. El down borra todo lo que creó.

const bcrypt = require('bcrypt');

const DIAS = 425; // ~14 meses
const CLIENTES = 650;
const DOMINIO = '@historia.burgerfast';
const DIAS_CON_PROMOS = 120; // las promos se usan en los últimos 4 meses
const USO_DE_PROMOS = 0.35;

// La semilla vieja: se borra lo que haya cargado
const DOMINIO_VIEJO = '@demo.burgerfast';
const SEMILLA_VIEJA = '20261020010000-ventas-demo.js';

// Personalidad de cada sucursal (las que no estén acá reciben una al azar)
//  volumen: cuánto vende · tendencia: cuánto crece (o cae) por mes en los últimos meses
//  velocidad: >1 = más lenta para entregar · mediodia: peso extra al mediodía
const PERFILES = {
  'BurgerFast Belgrano': { volumen: 1.5, tendencia: 0.08, velocidad: 0.85, mediodia: 1.2, favorito: 'Combo Doble Habemus' },
  'BurgerFast Microcentro': { volumen: 1.4, tendencia: 0.18, velocidad: 0.8, mediodia: 2.4, favorito: 'Combo Fast Classic' },
  'BurgerFast Morón': { volumen: 1.15, tendencia: 0.04, velocidad: 1, mediodia: 1, favorito: 'Combo Habemus Bacon' },
  'BurgerFast Ramos Mejía': { volumen: 1, tendencia: -0.08, velocidad: 1.05, mediodia: 1, favorito: 'Combo Crispy Crack' },
  'BurgerFast Hurlingham': { volumen: 0.85, tendencia: 0.22, velocidad: 1.15, mediodia: 0.9, favorito: 'Combo Bestia Fast' },
  'BurgerFast San Miguel': { volumen: 0.75, tendencia: -0.1, velocidad: 1.25, mediodia: 0.9, favorito: 'Combo Spicy Fast' },
  'BurgerFast El Palomar': { volumen: 0.6, tendencia: 0, velocidad: 1.1, mediodia: 0.8, favorito: 'Combo Fast Mushroom' },
  'BurgerFast Muñiz': { volumen: 0.5, tendencia: -0.15, velocidad: 1.35, mediodia: 0.8, favorito: 'Combo Blue Fast' },
};

// Insumos que quedan en 0 en una sucursal (se restauran en el down)
const SIN_STOCK = [
  { insumo: 'Queso azul', sucursal: 'BurgerFast Morón' },
  { insumo: 'Champiñones salteados', sucursal: 'BurgerFast Belgrano' },
  { insumo: 'Palta', sucursal: 'BurgerFast Microcentro' },
  { insumo: 'Jalapeños', sucursal: 'BurgerFast San Miguel' },
];

// Tipos de cliente: qué parte son y cuántos pedidos hacen por día (en promedio)
const TIPOS_CLIENTE = [
  { tipo: 'fiel', parte: 0.07, ritmo: 0.33 },
  { tipo: 'regular', parte: 0.28, ritmo: 0.13 },
  { tipo: 'ocasional', parte: 0.65, ritmo: 0.05 },
];

// Clientes "dormidos" a propósito: cuántos y hace cuántos días fue su último pedido
const DORMIDOS = [
  { cantidad: 6, hace: 40 },
  { cantidad: 6, hace: 70 },
  { cantidad: 8, hace: 110 },
];

const NOMBRES = ['Lucía', 'Martín', 'Sofía', 'Juan', 'Valentina', 'Tomás', 'Camila', 'Facundo', 'Julieta', 'Nicolás',
  'Agustina', 'Matías', 'Florencia', 'Gonzalo', 'Micaela', 'Lautaro', 'Carolina', 'Federico', 'Rocío', 'Ezequiel',
  'Paula', 'Santiago', 'Milagros', 'Joaquín', 'Brenda', 'Ignacio', 'Aldana', 'Bruno', 'Daiana', 'Leandro'];
const APELLIDOS = ['González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Pérez', 'Gómez', 'Díaz', 'Romero',
  'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Benítez', 'Acosta', 'Medina', 'Herrera', 'Suárez', 'Aguirre',
  'Giménez', 'Molina', 'Castro', 'Ortiz'];
const CALLES = ['Av. Rivadavia', 'Belgrano', 'San Martín', 'Sarmiento', 'Mitre', 'Moreno', 'Alsina', 'Av. Gaona',
  'Pueyrredón', 'Lavalle', 'Brown', 'Av. de Mayo'];
const OBSERVACIONES = ['Sin sal en las papas, por favor', 'La hamburguesa bien cocida', 'Cortar al medio',
  'Sin cebolla', 'Mandar servilletas extra', 'Salsas aparte', 'Tocar timbre 2B', 'Dejar en portería'];

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
const PESO_HORA = { 9: 1, 10: 1.5, 11: 2.5, 12: 8, 13: 9, 14: 5, 15: 2, 16: 2, 17: 2.5, 18: 4, 19: 6, 20: 9, 21: 10, 22: 7 };
const HORAS_MEDIODIA = [12, 13, 14];
// Más pedidos el fin de semana (0 = domingo … 6 = sábado)
const PESO_DIA_SEMANA = [1.25, 0.8, 0.85, 0.9, 1, 1.3, 1.45];
// Popularidad de cada categoría
const PESO_CATEGORIA = {
  Combos: 6, Hamburguesas: 5, 'Papas Fritas': 3.5, Bebidas: 1.2, Nuggets: 2.2, Postres: 1.2,
  Café: 1, 'Menú Café': 0.9, Ensaladas: 0.6, Salsas: 0.5,
};
const CATEGORIAS_DESAYUNO = ['Café', 'Menú Café'];

const DIA_MS = 86400000;
// Pedidos por día de una sucursal de volumen 1, cuando el negocio ya creció
const PEDIDOS_POR_DIA = 7;

// Inserta muchas filas de a lotes (más rápido que una por una)
async function insertarPorLotes(queryInterface, tabla, filas, transaction, tamanio = 1000) {
  for (let i = 0; i < filas.length; i += tamanio) {
    await queryInterface.bulkInsert(tabla, filas.slice(i, i + tamanio), { transaction });
  }
}

// Borra los clientes de un dominio con sus pedidos (el detalle y el historial se van en cascada)
async function borrarClientes(q, dominio) {
  const d = `%${dominio}`;
  await q('DELETE FROM "Pedidos" WHERE "usuarioId" IN (SELECT id FROM "Usuarios" WHERE email LIKE :d)', { d });
  await q('DELETE FROM "Direccions" WHERE "usuarioId" IN (SELECT id FROM "Usuarios" WHERE email LIKE :d)', { d });
  await q('DELETE FROM "Usuarios" WHERE email LIKE :d', { d });
}

async function restaurarStock(q) {
  for (const s of SIN_STOCK) {
    await q(
      `UPDATE "StockSucursals" SET cantidad = GREATEST(cantidad, 150), "updatedAt" = NOW()
        WHERE "insumoId" = (SELECT id FROM "Insumos" WHERE nombre = :insumo)
          AND "sucursalId" = (SELECT id FROM "Sucursals" WHERE nombre = :sucursal)`,
      s
    );
  }
}

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    const { azar, entre, elegir, ponderado } = crearAzar(20261107);

    await sequelize.transaction(async (transaction) => {
      const q = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, transaction }))[0];

      // ---------- 1. Limpiar la semilla vieja de ventas demo ----------
      await borrarClientes(q, DOMINIO_VIEJO);
      await restaurarStock(q);
      const [{ registro }] = await q(`SELECT to_regclass('"SequelizeData"') IS NOT NULL AS registro`);
      if (registro) await q('DELETE FROM "SequelizeData" WHERE name = :n', { n: SEMILLA_VIEJA });

      const [{ ya }] = await q('SELECT COUNT(*)::int AS ya FROM "Usuarios" WHERE email LIKE :d', { d: `%${DOMINIO}` });
      if (ya > 0) return; // ya estaba cargada

      // ---------- 2. Catálogo actual ----------
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
      const promos = await q('SELECT id, tipo, dias, "maxPorPedido", "compraMinima" FROM "Promociones" WHERE activo = true ORDER BY id');
      const itemsPromo = await q(`
        SELECT pi."promocionId", pi."productoId", pi.cantidad, pi.descuento, p.precio
        FROM "PromocionItems" pi JOIN "Productos" p ON p.id = pi."productoId"
        WHERE p."deletedAt" IS NULL
        ORDER BY pi."promocionId", pi.orden`);

      const tamaniosDe = (id) => tamanios.filter((t) => t.productoId === id);
      const gruposDe = (id) => grupos.filter((g) => g.productoId === id);
      const extrasDe = (id) => extras.filter((e) => e.productoId === id);

      // Popularidad de cada producto: su categoría y su "suerte" (unos dominan, otros casi no salen)
      for (const p of productos) p.peso = (PESO_CATEGORIA[p.categoria] ?? 1) * (0.08 + azar() ** 2 * 2.2);

      // Cada promo con sus productos y su popularidad (la de la semana se usa más)
      for (const promo of promos) {
        promo.items = itemsPromo.filter((i) => i.promocionId === promo.id);
        promo.peso = (promo.tipo === 'SEMANA' ? 2 : 1) * (0.3 + azar() * 1.7);
      }
      const promosUsables = promos.filter((p) => p.items.length > 0);

      // Personalidad de cada sucursal
      for (const s of sucursales) {
        const perfil = PERFILES[s.nombre] ?? {
          volumen: 0.5 + azar(), tendencia: (azar() - 0.5) * 0.12, velocidad: 0.9 + azar() * 0.4, mediodia: 1, favorito: null,
        };
        Object.assign(s, perfil);
        s.productoFavorito = productos.find((p) => p.nombre === perfil.favorito) ?? null;
        s.ruido = {}; // variación de cada mes
        s.diasMalos = new Set(); // días con muchas cancelaciones
      }

      // ---------- 3. El calendario ----------
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const ahora = Date.now();
      const diaN = (n) => new Date(hoy.getTime() - (DIAS - n) * DIA_MS); // n = 0 … DIAS (hoy)
      const lluvia = Array.from({ length: DIAS + 1 }, () => azar() < 0.06);
      for (const s of sucursales) {
        for (let n = 0; n <= DIAS; n++) if (azar() < 0.035) s.diasMalos.add(n);
      }
      // El negocio crece hasta hace 6 meses y después se estabiliza
      const crecimiento = (n) => Math.min(1, 0.4 + 0.6 * (n / (DIAS - 180)));
      // Cada sucursal sube o baja según su tendencia, con algo de ruido por mes
      const ritmoSucursal = (s, n) => {
        const fecha = diaN(n);
        const mes = `${fecha.getFullYear()}-${fecha.getMonth()}`;
        if (s.ruido[mes] === undefined) s.ruido[mes] = 0.98 + azar() * 0.04;
        return Math.exp(-s.tendencia * Math.min(4, (DIAS - n) / 30.4)) * s.ruido[mes]; // la tendencia pesa en los últimos 4 meses
      };

      // ---------- 4. Clientes ----------
      const password = bcrypt.hashSync('demo1234', 10);
      const parejas = [];
      for (const nombre of NOMBRES) for (const apellido of APELLIDOS) parejas.push([nombre, apellido]);
      for (let i = parejas.length - 1; i > 0; i--) {
        const j = Math.floor(azar() * (i + 1));
        [parejas[i], parejas[j]] = [parejas[j], parejas[i]];
      }

      const clientes = [];
      for (let k = 0; k < CLIENTES; k++) {
        const sucursal = ponderado(sucursales, (s) => s.volumen);
        const tipo = ponderado(TIPOS_CLIENTE, (t) => t.parte);

        // Cuándo llega: más a medida que el negocio crece, con un mes y una semana de campaña
        let alta;
        const r = azar();
        if (r < 0.15) alta = entre(0, 20); // los clientes de la apertura
        else if (r < 0.27) alta = entre(DIAS - 100, DIAS - 72);
        else if (r < 0.32) alta = entre(DIAS - 24, DIAS - 18);
        else alta = ponderado(Array.from({ length: DIAS - 3 }, (_, n) => n), (n) => 0.4 + crecimiento(n));
        if (tipo.tipo === 'fiel') alta = Math.min(alta, DIAS - 90); // los fieles ya llevan un tiempo

        // Algunos dejan de pedir en algún momento
        let baja = DIAS;
        if (tipo.tipo !== 'fiel' && azar() < 0.28) baja = entre(Math.min(DIAS, alta + 30), DIAS);

        clientes.push({
          sucursal, tipo, alta, baja,
          favorito: ponderado(productos, (p) => p.peso), // su producto preferido
        });
      }

      // Dormidos a propósito, para el buzón de inactivos (30, 60 y 90 días)
      const candidatos = clientes.filter((c) => c.tipo.tipo !== 'ocasional' && c.baja === DIAS);
      for (const grupo of DORMIDOS) {
        for (let i = 0; i < grupo.cantidad && candidatos.length > 0; i++) {
          const cliente = candidatos.splice(Math.floor(azar() * candidatos.length), 1)[0];
          cliente.baja = DIAS - grupo.hace - entre(0, 3);
          cliente.alta = Math.min(cliente.alta, cliente.baja - 60);
          cliente.forzarUltimo = true; // pide justo el último día
        }
      }

      // ---------- 5. Pedidos (en memoria) ----------
      const horas = Object.keys(PESO_HORA).map(Number);
      const pedidos = [];

      const armarLinea = (producto, fecha) => {
        const tams = tamaniosDe(producto.id);
        const tam = tams.length > 0 ? ponderado(tams, (t) => [5, 3, 1][tams.indexOf(t)] ?? 1) : null;
        let precio = Number(tam ? tam.precio : producto.precio);

        // Algún extra en ~15 % de las líneas que lo permiten
        const personalizaciones = [];
        const posibles = extrasDe(producto.id);
        if (posibles.length > 0 && azar() < 0.15) {
          const extra = elegir(posibles);
          personalizaciones.push({ insumoId: extra.insumoId, cantidad: Number(extra.cantidadBase) + 1 });
          precio += Number(extra.precioComercial);
        }

        return {
          productoId: producto.id,
          cantidad: azar() < 0.85 ? 1 : 2,
          precio,
          tamanioId: tam ? tam.tamanioId : null,
          personalizaciones,
          combo: armarCombo(producto.id),
          promocionId: null,
          precioLista: null,
          fecha,
        };
      };

      // Combo: la opción incluida de cada lugar (a veces "sin bebida")
      const armarCombo = (productoId) => {
        const gs = gruposDe(productoId);
        if (gs.length === 0) return null;
        return {
          elecciones: gs
            .filter((g, i) => !(i === gs.length - 1 && azar() < 0.07))
            .map((g) => ({ grupoId: g.id, productoId: g.productoIncluidoId, recargo: 0 })),
          recargo: 0,
        };
      };

      const crearPedido = (cliente, sucursal, fecha, estado, n) => {
        const desayuno = fecha.getHours() < 12;
        const pesoPara = (p) => p.peso
          * (p.id === cliente.favorito.id ? 6 : 1)
          * (sucursal.productoFavorito && p.id === sucursal.productoFavorito.id ? 12 : 1)
          * (CATEGORIAS_DESAYUNO.includes(p.categoria) ? (desayuno ? 6 : 0.4) : 1);

        const lineas = [];
        const nLineas = ponderado([1, 2, 3, 4], (k) => [5, 4, 2, 1][k - 1]);
        for (let l = 0; l < nLineas; l++) lineas.push(armarLinea(ponderado(productos, pesoPara), fecha));

        // Promo válida ese día (solo en los últimos meses)
        if (n >= DIAS - DIAS_CON_PROMOS && azar() < USO_DE_PROMOS) {
          const subtotal = lineas.reduce((s, x) => s + x.precio * x.cantidad, 0);
          const validas = promosUsables.filter((p) =>
            (!p.dias || p.dias.length === 0 || p.dias.includes(fecha.getDay()))
            && (!p.compraMinima || subtotal >= p.compraMinima));
          if (validas.length > 0) {
            const promo = ponderado(validas, (p) => p.peso);
            const veces = !promo.maxPorPedido && azar() < 0.15 ? 2 : 1;
            for (const item of promo.items) {
              const precioLista = Number(item.precio);
              lineas.push({
                productoId: item.productoId,
                cantidad: item.cantidad * veces,
                precio: Math.round(precioLista * (1 - Number(item.descuento))),
                tamanioId: null,
                personalizaciones: [],
                combo: armarCombo(item.productoId),
                promocionId: promo.id,
                precioLista,
                fecha,
              });
            }
          }
        }

        pedidos.push({
          cliente, sucursal, fecha, estado, lineas,
          total: lineas.reduce((s, x) => s + x.precio * x.cantidad, 0),
          observaciones: azar() < 0.1 ? elegir(OBSERVACIONES) : null,
        });
      };

      const elegirHora = (sucursal, dia) => {
        const hora = ponderado(horas, (h) => PESO_HORA[h] * (HORAS_MEDIODIA.includes(h) ? sucursal.mediodia : 1));
        const fecha = new Date(dia);
        fecha.setHours(hora, entre(0, 59), entre(0, 59));
        return fecha;
      };

      const ultimaHora = ahora - 60 * 60000; // lo de la última hora se arma aparte (pedidos en curso)
      const estadoFinal = (sucursal, n) =>
        azar() < (sucursal.diasMalos.has(n) ? 0.3 : 0.05) ? 'Cancelado' : 'Entregado';

      // Cuántos pedidos recibe cada sucursal cada día. Primero se fija el total de cada mes
      // (volumen, crecimiento y tendencia) y después se reparte entre sus días según el día
      // de la semana, la lluvia y un poco de azar. Así cada mes sube o baja lo que debe.
      for (const sucursal of sucursales) {
        const pesoDia = [];
        const porMes = new Map();
        for (let n = 0; n <= DIAS; n++) {
          const dia = diaN(n);
          pesoDia[n] = PESO_DIA_SEMANA[dia.getDay()] * (lluvia[n] ? 1.9 : 1) * (0.85 + azar() * 0.3);
          const mes = `${dia.getFullYear()}-${dia.getMonth()}`;
          if (!porMes.has(mes)) porMes.set(mes, { peso: 0, objetivo: 0 });
          const m = porMes.get(mes);
          m.peso += pesoDia[n];
          m.objetivo += PEDIDOS_POR_DIA * sucursal.volumen * crecimiento(n) * ritmoSucursal(sucursal, n);
        }

        let resto = 0; // lo que sobra al redondear pasa al día siguiente
        sucursal.pedidosDelDia = [];
        for (let n = 0; n <= DIAS; n++) {
          const dia = diaN(n);
          const m = porMes.get(`${dia.getFullYear()}-${dia.getMonth()}`);
          const exacto = (m.objetivo * pesoDia[n]) / m.peso + resto;
          sucursal.pedidosDelDia[n] = Math.round(exacto);
          resto = exacto - sucursal.pedidosDelDia[n];
        }
      }

      // Cada sucursal reparte sus pedidos del día entre sus clientes activos:
      // los fieles piden más seguido que los ocasionales.
      for (let n = 0; n <= DIAS; n++) {
        const dia = diaN(n);
        for (const sucursal of sucursales) {
          const activos = clientes.filter((c) => c.sucursal === sucursal && c.alta < n && n <= c.baja);
          if (activos.length === 0) continue;

          for (let k = 0; k < sucursal.pedidosDelDia[n]; k++) {
            const fecha = elegirHora(sucursal, dia);
            if (fecha.getTime() > ultimaHora) continue;
            crearPedido(ponderado(activos, (c) => c.tipo.ritmo), sucursal, fecha, estadoFinal(sucursal, n), n);
          }
        }
      }

      // Cada cliente pide el día que llega, y los dormidos, el día de su último pedido
      // (siempre entregados, para que cuenten en los reportes)
      for (const cliente of clientes) {
        const dias = cliente.forzarUltimo ? [cliente.alta, cliente.baja] : [cliente.alta];
        for (const n of dias) {
          const fecha = elegirHora(cliente.sucursal, diaN(n));
          if (fecha.getTime() <= ultimaHora) crearPedido(cliente, cliente.sucursal, fecha, 'Entregado', n);
        }
      }

      // Ahora mismo: pedidos en curso para la cinta de pedidos
      const enCurso = [
        ['Pendiente', 3], ['Pendiente', 7], ['Pendiente', 12],
        ['En proceso', 16], ['En proceso', 21], ['En proceso', 27],
        ['En camino', 33], ['En camino', 38], ['En camino', 44], ['En camino', 50],
      ];
      enCurso.forEach(([estado, hace], i) => {
        const sucursal = sucursales[i % sucursales.length];
        const activos = clientes.filter((c) => c.sucursal === sucursal && c.baja === DIAS && c.alta < DIAS);
        const cliente = activos.length > 0 ? elegir(activos) : elegir(clientes);
        crearPedido(cliente, sucursal, new Date(ahora - hace * 60000), estado, DIAS);
      });

      // ---------- 6. Guardar clientes (fecha de alta = la de su primer pedido) ----------
      const primerPedido = new Map();
      for (const p of pedidos) {
        const antes = primerPedido.get(p.cliente);
        if (!antes || p.fecha < antes) primerPedido.set(p.cliente, p.fecha);
      }

      let numero = 0;
      for (const cliente of clientes) {
        if (!primerPedido.has(cliente)) continue; // nunca llegó a pedir
        numero++;
        const alta = new Date(primerPedido.get(cliente).getTime() - entre(0, 3) * DIA_MS - entre(5, 300) * 60000);
        const [nombre, apellido] = parejas[(numero - 1) % parejas.length];
        const s = cliente.sucursal;
        const [usuario] = await q(
          `INSERT INTO "Usuarios" (nombre, apellido, email, password, telefono, "sucursalId", "createdAt", "updatedAt")
           VALUES (:nombre, :apellido, :email, :password, :telefono, :sucursalId, :alta, :alta) RETURNING id`,
          {
            nombre, apellido, password, alta,
            email: `cliente${String(numero).padStart(3, '0')}${DOMINIO}`,
            telefono: `11-${entre(4000, 6999)}-${entre(1000, 9999)}`,
            sucursalId: s.id,
          }
        );
        const [direccion] = await q(
          `INSERT INTO "Direccions" (alias, calle, numero, localidad, provincia, latitud, longitud, predeterminada, "usuarioId", "createdAt", "updatedAt")
           VALUES ('Casa', :calle, :numero, :localidad, :provincia, :latitud, :longitud, true, :usuarioId, :alta, :alta) RETURNING id`,
          {
            calle: elegir(CALLES),
            numero: String(entre(100, 4999)),
            localidad: s.localidad,
            provincia: s.provincia,
            latitud: Number(s.latitud) + (azar() - 0.5) * 0.02, // a menos de ~1,5 km de su sucursal
            longitud: Number(s.longitud) + (azar() - 0.5) * 0.02,
            usuarioId: usuario.id,
            alta,
          }
        );
        cliente.id = usuario.id;
        cliente.direccionId = direccion.id;
      }

      // ---------- 7. Guardar pedidos, detalle e historial ----------
      pedidos.sort((a, b) => a.fecha - b.fecha);
      const ids = await q(
        `SELECT nextval(pg_get_serial_sequence('"Pedidos"', 'id'))::int AS id FROM generate_series(1, :n)`,
        { n: pedidos.length }
      );
      pedidos.forEach((p, i) => { p.id = ids[i].id; });

      const minutos = (fecha, min) => new Date(fecha.getTime() + min * 60000);
      const filasPedidos = [];
      const filasDetalle = [];
      const filasHistorial = [];

      for (const p of pedidos) {
        filasPedidos.push({
          id: p.id, usuarioId: p.cliente.id, direccionId: p.cliente.direccionId, sucursalId: p.sucursal.id,
          fecha: p.fecha, total: p.total, estado: p.estado, observaciones: p.observaciones,
          createdAt: p.fecha, updatedAt: p.fecha,
        });

        for (const l of p.lineas) {
          filasDetalle.push({
            pedidoId: p.id, productoId: l.productoId, tamanioId: l.tamanioId, cantidad: l.cantidad, precio: l.precio,
            personalizaciones: JSON.stringify(l.personalizaciones),
            combo: l.combo ? JSON.stringify(l.combo) : null,
            promocionId: l.promocionId, precioLista: l.precioLista,
            createdAt: p.fecha, updatedAt: p.fecha,
          });
        }

        // Historial: los mismos pasos que hace el admin, con tiempos según la sucursal
        const pasos = [{ estado: 'pendiente', anterior: null, fecha: p.fecha }];
        if (p.estado === 'Cancelado') {
          pasos.push({ estado: 'Cancelado', anterior: 'pendiente', fecha: minutos(p.fecha, entre(2, 10)) });
        } else {
          const cadena = ['En proceso', 'En camino', 'Entregado'];
          const v = p.sucursal.velocidad;
          const duraciones = [entre(3, 7), Math.round(entre(10, 18) * v), Math.round(entre(14, 24) * v)];
          let t = p.fecha;
          let anterior = 'pendiente';
          for (let i = 0; i < cadena.indexOf(p.estado) + 1; i++) {
            t = minutos(t, duraciones[i]);
            if (t.getTime() > ahora) break; // los pedidos en curso no tienen pasos en el futuro
            pasos.push({ estado: cadena[i], anterior, fecha: t });
            anterior = cadena[i];
          }
        }
        for (const paso of pasos) {
          filasHistorial.push({
            pedidoId: p.id, estado: paso.estado, estadoAnterior: paso.anterior, fecha: paso.fecha, createdAt: paso.fecha,
          });
        }
      }

      await insertarPorLotes(queryInterface, 'Pedidos', filasPedidos, transaction);
      await insertarPorLotes(queryInterface, 'DetallePedidos', filasDetalle, transaction);
      await insertarPorLotes(queryInterface, 'historialDeTiemposPedido', filasHistorial, transaction);

      // ---------- 8. Algunos insumos sin stock ----------
      for (const s of SIN_STOCK) {
        await q(
          `UPDATE "StockSucursals" SET cantidad = 0, "updatedAt" = NOW()
            WHERE "insumoId" = (SELECT id FROM "Insumos" WHERE nombre = :insumo)
              AND "sucursalId" = (SELECT id FROM "Sucursals" WHERE nombre = :sucursal)`,
          s
        );
      }
    });
  },

  // Borra los clientes de la historia: sus pedidos, detalles, historial y direcciones.
  // El stock que quedó en 0 vuelve a un valor normal.
  async down(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      const q = (sql, replacements) => sequelize.query(sql, { replacements, transaction });
      await borrarClientes(q, DOMINIO);
      await restaurarStock(q);
    });
  },
};