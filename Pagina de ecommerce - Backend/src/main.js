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


//SINCRO CON BASE DE DATOS
async function iniciarServidor(){
    try {
        console.log('Sincronizando base de datos...');

        await db.sequelize.sync({ force: false });

        console.log('Base de datos sincronizada');

       app.listen(PORT, () => { 
        
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
       })
        
    } catch (error) {
        console.error('Error conectando con la base de datos:', error.message);
    }
}

iniciarServidor();