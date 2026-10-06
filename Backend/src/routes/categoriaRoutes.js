const { Router } = require('express');
const router = Router();

// La tienda solo lee las categorías: reutiliza el mismo controlador del panel
const categoriaController = require('../controllers/admin/categoriaController');

router.get('/', categoriaController.obtenerCategorias);

module.exports = router;