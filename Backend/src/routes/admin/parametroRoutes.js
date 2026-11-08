const { Router } = require('express');
const router = Router();

const parametroController = require('../../controllers/admin/parametroController');
const { esAdminJwt } = require('../../middleware/admin/esAdminJwt');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');
const { validarParametros } = require('../../middleware/admin/validarParametros');

router.get('/', esAdminJwt, parametroController.verParametros);
router.put('/', esMasterJwt, validarParametros, parametroController.guardarParametros);

module.exports = router;