const express = require('express');
require('dotenv').config()

const db = require('./models')
const cors = require('cors')

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors())
app.use(express.json());

//RUTAS
app.get('/', (req, res) => {
    res.json({
        mensaje: 'Backend de pedidos funcionando'
    });
});

const adminRoutes = require('./routes/admin/adminRoutes');
const adminProductoRoutes = require('./routes/admin/productoRoutes');
const adminCategoriaRoutes = require('./routes/admin/categoriaRoutes');
const adminStockRoutes = require('./routes/admin/stockRoutes');

const productoRoutes = require('./routes/productoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const direccionRoutes = require('./routes/direccionRoutes');
const sucursalRoutes = require('./routes/sucursalRoutes');


app.use('/admin/productos', adminProductoRoutes);
app.use('/admin/categorias', adminCategoriaRoutes);
app.use('/admin/stock', adminStockRoutes);
app.use('/admin/sucursales', require('./routes/admin/sucursalRoutes'));
app.use('/admin/pedidos', require('./routes/admin/pedidoRoutes'));
app.use('/admin/insumos', require('./routes/admin/insumoRoutes')); 
app.use('/admin', adminRoutes);


app.use('/productos', productoRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/pedido', pedidoRoutes);
app.use('/direcciones', direccionRoutes);
app.use('/sucursales', sucursalRoutes);
app.use('/geo', require('./routes/geo'));
app.use('/tamanios', require('./routes/tamanioRoutes'));  

// Al arrancar, solo se verifica la conexión: las tablas las crean y cambian las migraciones
async function iniciarServidor() {
    try {
        await db.sequelize.authenticate();
        console.log('Conexión con la base de datos OK');

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo conectar con la base de datos:', error.message);
        process.exit(1);
    }
}

iniciarServidor();

iniciarServidor();