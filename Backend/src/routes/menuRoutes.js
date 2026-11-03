const { Router } = require('express');
const router = Router();

const menuController = require('../controllers/menuController');

router.get('/', menuController.obtenerMenu);

module.exports = router;
