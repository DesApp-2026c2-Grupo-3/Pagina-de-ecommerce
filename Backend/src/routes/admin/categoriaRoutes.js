const { Router } = require('express');
const router = Router();

const categoriaController = require('../../controllers/admin/categoriaController');
const { validarCategoria } = require('../../middleware/admin/validarCategoria');
const { esIdValido } = require('../../middleware/esIdValido');


router.get('/', categoriaController.obtenerCategorias);
router.post('/nueva', validarCategoria, categoriaController.crearCategoria);
router.patch('/editar/:id', validarCategoria, esIdValido, categoriaController.editarCategoriaPorId);
router.delete('/eliminar/:id', esIdValido, categoriaController.eliminarCategorias);

module.exports = router;
