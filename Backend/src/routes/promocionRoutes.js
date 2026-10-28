const { Router } = require('express');
const { obtenerPromociones } = require('../controllers/promocionController');

const router = Router();

router.get('/', obtenerPromociones);

module.exports = router;
