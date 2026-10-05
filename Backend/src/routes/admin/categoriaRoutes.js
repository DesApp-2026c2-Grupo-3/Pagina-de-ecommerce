const { Router } = require('express');
const router = Router();

const categoriaController = require('../../controllers/admin/categoriaController');
const { validarCategoria } = require('../../middleware/admin/validarCategoria');
const { esIdValido } = require('../../middleware/esIdValido');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');


router.get('/', categoriaController.obtenerCategorias);
router.post('/nueva', esMasterJwt, validarCategoria, categoriaController.crearCategoria);
router.patch('/editar/:id', esMasterJwt, validarCategoria, esIdValido, categoriaController.editarCategoriaPorId);
router.delete('/eliminar/:id', esMasterJwt, esIdValido, categoriaController.eliminarCategorias);

module.exports = router;
