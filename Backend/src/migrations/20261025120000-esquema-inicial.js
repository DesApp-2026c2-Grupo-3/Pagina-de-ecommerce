'use strict';

// Migración ÚNICA del esquema: reemplaza a las 36 anteriores (están en migrations/_historico, solo como referencia).
// Crea las 17 tablas tal como quedaban después de correr todas las migraciones viejas, en el mismo orden
// en que se necesitan por las claves foráneas.
//
// - Los datos NO van acá: los tamaños, el catálogo, sucursales, admin, etc. los carga la semilla
//   20261020000000-catalogo-definitivo.
// - Si tu base ya tenía las migraciones viejas aplicadas, esta migración lo detecta y no hace nada
//   (no hace falta borrar la base). Para empezar de cero: db:drop + db:create + db:migrate + db:seed:all.
// - Para cambiar el esquema de acá en adelante: agregar una migración nueva, nunca editar esta.

module.exports = {
  async up(queryInterface, Sequelize) {
    const { HORARIO_POR_DEFECTO } = require('../utils/horarioSucursal');

    // Base que ya tenía el esquema (por las migraciones viejas o por sync): no se toca
    const tablasExistentes = await queryInterface.showAllTables();
    if (tablasExistentes.includes('Sucursals')) {
      console.log('ℹ️  La base ya tenía las tablas: el esquema inicial se da por aplicado.');
      return;
    }

    const id = { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false };
    const timestamps = {
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    };
    const ref = (model, opciones = {}) => ({ references: { model, key: 'id' }, ...opciones });

    await queryInterface.sequelize.transaction(async (transaction) => {
      const crear = (tabla, columnas) => queryInterface.createTable(tabla, columnas, { transaction });
      const unica = (tabla, fields, name) =>
        queryInterface.addConstraint(tabla, { fields, type: 'unique', name, transaction });

      // ---------- Sucursales, usuarios y admins ----------
      await crear('Sucursals', {
        id,
        nombre: { type: Sequelize.STRING, allowNull: false },
        calle: { type: Sequelize.STRING, allowNull: false },
        numero: { type: Sequelize.STRING, allowNull: true },
        localidad: { type: Sequelize.STRING, allowNull: false },
        provincia: { type: Sequelize.STRING, allowNull: false },
        codigoPostal: { type: Sequelize.STRING, allowNull: true },
        telefono: { type: Sequelize.STRING, allowNull: true },
        latitud: { type: Sequelize.FLOAT, allowNull: false },
        longitud: { type: Sequelize.FLOAT, allowNull: false },
        // Hasta qué distancia (en línea recta) la sucursal hace delivery
        radioEntregaKm: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 5 },
        // Permite "apagar" una sucursal sin borrarla (no rompe usuarios ni pedidos)
        activa: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        zona_horaria: { type: Sequelize.STRING, allowNull: false, defaultValue: 'America/Argentina/Buenos_Aires' },
        // Horario por día: { lunes: { apertura, cierre, abierto }, ... }
        horario: { type: Sequelize.JSONB, allowNull: false, defaultValue: JSON.stringify(HORARIO_POR_DEFECTO) },
        ...timestamps,
      });
      await unica('Sucursals', ['nombre'], 'sucursal_nombre_unico');

      await crear('Usuarios', {
        id,
        nombre: { type: Sequelize.STRING, allowNull: false },
        apellido: { type: Sequelize.STRING, allowNull: true },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: { type: Sequelize.STRING, allowNull: false },
        telefono: { type: Sequelize.STRING, allowNull: true },
        dni: { type: Sequelize.STRING, allowNull: true },
        fechaNacimiento: { type: Sequelize.DATEONLY, allowNull: true },
        sucursalId: { type: Sequelize.INTEGER, allowNull: true, ...ref('Sucursals', { onDelete: 'SET NULL' }) },
        ...timestamps,
      });

      await crear('Admins', {
        id,
        nombre: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: { type: Sequelize.STRING, allowNull: false },
        rol: { type: Sequelize.STRING, allowNull: false, defaultValue: 'ADMIN' },
        activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        // La sucursal que gestiona cada admin (vacía para el MASTER)
        sucursalId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          ...ref('Sucursals', { onUpdate: 'CASCADE', onDelete: 'SET NULL' }),
        },
        ...timestamps,
      });

      await crear('TokensRecuperacion', {
        id,
        usuarioId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Usuarios', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        tokenHash: { type: Sequelize.STRING(64), allowNull: false, unique: true },
        expiraEn: { type: Sequelize.DATE, allowNull: false },
        usadoEn: { type: Sequelize.DATE, allowNull: true },
        ...timestamps,
      });

      // Borrado lógico (deletedAt): los pedidos viejos conservan la dirección de entrega
      await crear('Direccions', {
        id,
        alias: { type: Sequelize.STRING },
        calle: { type: Sequelize.STRING },
        numero: { type: Sequelize.STRING },
        piso: { type: Sequelize.STRING },
        localidad: { type: Sequelize.STRING },
        provincia: { type: Sequelize.STRING },
        codigoPostal: { type: Sequelize.STRING },
        entreCalles: { type: Sequelize.STRING },
        observaciones: { type: Sequelize.STRING(140) },
        // DECIMAL(10, 7): precisión de centímetros, sin errores de redondeo
        latitud: { type: Sequelize.DECIMAL(10, 7) },
        longitud: { type: Sequelize.DECIMAL(10, 7) },
        predeterminada: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        usuarioId: { type: Sequelize.INTEGER, allowNull: false, ...ref('Usuarios', { onDelete: 'CASCADE' }) },
        ...timestamps,
        deletedAt: { type: Sequelize.DATE, allowNull: true },
      });

      // ---------- Catálogo ----------
      await crear('Categoria', {
        id,
        nombre: { type: Sequelize.STRING, unique: true },
        ...timestamps,
      });

      // Borrado lógico (deletedAt): un producto "eliminado" sigue existiendo para los pedidos viejos
      await crear('Productos', {
        id,
        nombre: { type: Sequelize.STRING },
        descripcion: { type: Sequelize.TEXT },
        precio: { type: Sequelize.DECIMAL },
        imagen: { type: Sequelize.STRING },
        disponible: { type: Sequelize.BOOLEAN },
        categoriaId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          ...ref('Categoria', { onUpdate: 'CASCADE', onDelete: 'SET NULL' }),
        },
        // Solo bebidas: cola, naranja, lima, agua
        sabor: { type: Sequelize.STRING, allowNull: true },
        ...timestamps,
        deletedAt: { type: Sequelize.DATE, allowNull: true },
      });

      // Tamaños: regular = 1, mediano = 2, grande = 3 (los carga la semilla del catálogo)
      await crear('Tamanios', {
        id,
        nombre: { type: Sequelize.STRING, allowNull: false, unique: true },
        orden: { type: Sequelize.INTEGER, allowNull: false },
        // Imagen representativa del tamaño, se muestra en el selector de los combos
        imagen: { type: Sequelize.STRING, allowNull: true },
        ...timestamps,
      });

      // Precio de cada tamaño de un producto
      await crear('ProductoTamanios', {
        id,
        productoId: { type: Sequelize.INTEGER, allowNull: false, ...ref('Productos', { onDelete: 'CASCADE' }) },
        tamanioId: { type: Sequelize.INTEGER, allowNull: false, ...ref('Tamanios', { onDelete: 'RESTRICT' }) },
        precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        // Texto opcional para mostrar, ej: "354 ml"
        etiqueta: { type: Sequelize.STRING, allowNull: true },
        // Cuánto stock consume cada tamaño respecto de la receta (1 = tal cual)
        factorStock: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 1 },
        ...timestamps,
      });
      await unica('ProductoTamanios', ['productoId', 'tamanioId'], 'producto_tamanio_unico');

      // Grupos de un combo: qué "lugares" elegibles tiene (Acompañamiento, Bebida, ...)
      await crear('ComboGrupos', {
        id,
        productoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Productos', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        nombre: { type: Sequelize.STRING, allowNull: false },
        // Se elige un producto de esta categoría (ej: Papas Fritas, Bebidas)
        categoriaId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Categoria', { onUpdate: 'CASCADE', onDelete: 'RESTRICT' }),
        },
        // Opción incluida en el precio (si está vacía, es la más barata de la categoría)
        productoIncluidoId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          ...ref('Productos', { onUpdate: 'CASCADE', onDelete: 'RESTRICT' }),
        },
        obligatorio: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        icono: { type: Sequelize.STRING, allowNull: true },
        ...timestamps,
      });
      await unica('ComboGrupos', ['productoId', 'nombre'], 'combo_grupo_unico');

      // ---------- Insumos, recetas y stock ----------
      await crear('Insumos', {
        id,
        nombre: { type: Sequelize.STRING, allowNull: false, unique: true },
        unidadMedida: { type: Sequelize.STRING, allowNull: false },
        precioComercial: { type: Sequelize.DECIMAL, allowNull: true },
        ...timestamps,
      });

      await crear('RecetaInsumos', {
        id,
        productoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Productos', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        insumoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Insumos', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        cantidadBase: { type: Sequelize.DECIMAL, allowNull: false },
        esRemovible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        esAgregable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        ...timestamps,
      });
      await unica('RecetaInsumos', ['productoId', 'insumoId'], 'receta_insumo_producto_insumo_unique');

      await crear('StockSucursals', {
        id,
        insumoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Insumos', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        sucursalId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Sucursals', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        cantidad: { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
        stockMinimo: { type: Sequelize.DECIMAL, allowNull: true },
        ...timestamps,
      });
      await unica('StockSucursals', ['insumoId', 'sucursalId'], 'stock_sucursal_insumo_sucursal_unique');

      // ---------- Pedidos ----------
      await crear('Pedidos', {
        id,
        usuarioId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Usuarios', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        direccionId: { type: Sequelize.INTEGER, allowNull: true, ...ref('Direccions', { onDelete: 'SET NULL' }) },
        sucursalId: { type: Sequelize.INTEGER, allowNull: true, ...ref('Sucursals', { onDelete: 'SET NULL' }) },
        fecha: { type: Sequelize.DATE },
        total: { type: Sequelize.DECIMAL },
        estado: { type: Sequelize.STRING },
        observaciones: { type: Sequelize.TEXT, allowNull: true },
        ...timestamps,
      });

      await crear('DetallePedidos', {
        id,
        pedidoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Pedidos', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        productoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Productos', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        tamanioId: { type: Sequelize.INTEGER, allowNull: true, ...ref('Tamanios', { onDelete: 'RESTRICT' }) },
        cantidad: { type: Sequelize.INTEGER },
        precio: { type: Sequelize.DECIMAL },
        // Insumos cuya cantidad final difiere de la receta base: [{ insumoId, cantidad }]
        personalizaciones: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        // Si es un combo: lo que eligió el cliente en cada grupo
        combo: { type: Sequelize.JSON, allowNull: true },
        ...timestamps,
      });

      // Línea de tiempo de estados de cada pedido: un registro inmutable por transición
      await crear('historialDeTiemposPedido', {
        id,
        pedidoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Pedidos', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        estado: { type: Sequelize.STRING, allowNull: false },
        estadoAnterior: { type: Sequelize.STRING, allowNull: true },
        fecha: { type: Sequelize.DATE, allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false },
      });

      // Historial de cambios del stock: cada aumento y cada baja, con su motivo y quién la hizo
      await crear('MovimientoStocks', {
        id,
        sucursalId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Sucursals', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        insumoId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          ...ref('Insumos', { onUpdate: 'CASCADE', onDelete: 'CASCADE' }),
        },
        // 'aumento' o 'baja'
        tipo: { type: Sequelize.STRING, allowNull: false },
        cantidad: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
        cantidadAnterior: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
        cantidadNueva: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
        // Solo bajas: merma, vencimiento, rotura, faltante, correccion, otro
        motivo: { type: Sequelize.STRING, allowNull: true },
        detalle: { type: Sequelize.STRING(200), allowNull: true },
        // Quién lo hizo (queda vacío si después se borra ese admin)
        adminId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          ...ref('Admins', { onUpdate: 'CASCADE', onDelete: 'SET NULL' }),
        },
        // Si vino de un pedido (venta o devolución por cancelación)
        pedidoId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          ...ref('Pedidos', { onUpdate: 'CASCADE', onDelete: 'SET NULL' }),
        },
        ...timestamps,
      });
    });
  },

  async down(queryInterface) {
    // Orden inverso al de creación, por las claves foráneas
    const tablas = [
      'MovimientoStocks', 'historialDeTiemposPedido', 'DetallePedidos', 'Pedidos',
      'StockSucursals', 'RecetaInsumos', 'Insumos',
      'ComboGrupos', 'ProductoTamanios', 'Tamanios', 'Productos', 'Categoria',
      'Direccions', 'TokensRecuperacion', 'Admins', 'Usuarios', 'Sucursals',
    ];
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const tabla of tablas) {
        await queryInterface.dropTable(tabla, { transaction });
      }
    });
  },
};