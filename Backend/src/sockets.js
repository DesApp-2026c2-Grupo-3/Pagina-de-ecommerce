const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./models');

function inicializarSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Bloqueado por CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  // 1. Middleware de autenticación dual (Staff + Repartidor + Clientes públicos)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.user = { rol: 'CLIENTE_PUBLICO' };
      return next();
    }

    // Intento 1: Token de Staff (MASTER, ADMIN, EMPLEADO)
    try {
      const decodedAdmin = jwt.verify(token, process.env.SECRET_JWT_TOKEN);
      socket.user = decodedAdmin;
      return next();
    } catch {
      // Probamos si es un repartidor
    }

    // Intento 2: Token de Repartidor
    try {
      const decodedRepartidor = jwt.verify(
        token,
        process.env.SECRET_JWT_REPARTIDOR || process.env.SECRET_JWT_TOKEN
      );
      socket.user = {
        ...decodedRepartidor, // { id, sucursalId }
        rol: 'REPARTIDOR',
      };
      return next();
    } catch (error) {
      return next(new Error('No autorizado: token inválido o expirado'));
    }
  });

  // 2. Asignación automática de salas
  io.on('connection', async (socket) => {
    const { id, rol, sucursalId } = socket.user;
    const rolUpper = String(rol || '').toUpperCase();

    console.log(`Socket conectado: ${socket.id} | ID: ${id ?? 'Invitado'} | Rol: ${rolUpper}`);

    if (rolUpper === 'REPARTIDOR' && id) {
      socket.join(`repartidor_${id}`);
      if (sucursalId) socket.join(`sucursal_${sucursalId}`);
    } else if (rolUpper === 'MASTER') {
      socket.join('admin_global');
    } else if ((rolUpper === 'ADMIN' || rolUpper === 'EMPLEADO') && id) {
      try {
        const staff = await db.Admin.findByPk(id);
        if (staff && staff.sucursalId) {
          socket.join(`sucursal_${staff.sucursalId}`);
          console.log(`${rolUpper} ID ${id} unido a sucursal_${staff.sucursalId}`);
        }
      } catch (err) {
        console.error('Error buscando sucursal del staff:', err.message);
      }
    }

    // Sala privada para el Frontend de clientes
    socket.on('suscribir_cliente', ({ usuarioId, pedidoId }) => {
      for (const sala of socket.rooms) {
        if (sala.startsWith('cliente_') || sala.startsWith('pedido_')) {
          socket.leave(sala);
        }
      }
      if (usuarioId) socket.join(`cliente_${usuarioId}`);
      if (pedidoId) socket.join(`pedido_${pedidoId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`);
    });
  });

  return io;
}

function notificarCambioPedido(req, pedido) {
  const io = req.app.get('io');
  if (!io || !pedido) return;

  const clienteId = pedido.usuarioId || pedido.clienteId;
  const sucursalId = pedido.sucursalId;
  const repartidorId = pedido.repartidorId;

  if (sucursalId) {
    io.to(`sucursal_${sucursalId}`).to('admin_global').emit('pedido:actualizado', pedido);
  } else {
    io.to('admin_global').emit('pedido:actualizado', pedido);
  }

  if (clienteId) {
    io.to(`cliente_${clienteId}`).emit('pedido:actualizado', pedido);
  }
  if (pedido.id) {
    io.to(`pedido_${pedido.id}`).emit('pedido:actualizado', pedido);
  }

  if (repartidorId) {
    io.to(`repartidor_${repartidorId}`).emit('pedido:actualizado', pedido);
  }
}

module.exports = { inicializarSockets, notificarCambioPedido };
