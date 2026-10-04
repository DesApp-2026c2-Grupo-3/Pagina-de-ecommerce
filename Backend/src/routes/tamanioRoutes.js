const { Router } = require('express');
const router = Router();

const tamanioController = require('../controllers/tamanioController');

router.get('/', tamanioController.obtenerTamanios);

module.exports = router;