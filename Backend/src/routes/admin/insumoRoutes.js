const { Router } = require('express');
const router = Router();

const insumoController = require('../../controllers/admin/insumoController');

router.get('/', insumoController.obtenerInsumos);

module.exports = router;