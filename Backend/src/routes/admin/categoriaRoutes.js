const { Router } = require('express');
const router = Router();

const categoriaController = require('../../controllers/admin/categoriaController');


router.get('/', categoriaController.obtenerCategorias);
router.post('/nueva', categoriaController.crearCategoria);
router.patch('/editar/:id', categoriaController.editarCategoriaPorId);
router.delete('/eliminar/:id', categoriaController.eliminarCategorias);

module.exports = router;
