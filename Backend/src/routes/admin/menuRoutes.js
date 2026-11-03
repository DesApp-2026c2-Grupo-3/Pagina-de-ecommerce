const { Router } = require('express');
const router = Router();

const menuController = require('../../controllers/admin/menuController');
const { validarMenu } = require('../../middleware/admin/validarMenu');
const { esMasterJwt } = require('../../middleware/admin/esMasterJwt');

// Armar el menú del catálogo: solo el Admin-Master (también consultarlo)
router.get('/', esMasterJwt, menuController.obtenerMenu);
router.put('/', esMasterJwt, validarMenu, menuController.guardarMenu);

module.exports = router;
