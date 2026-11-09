const { Router } = require('express');
const router = Router();

const { verParametrosPublicos } = require('../controllers/parametroController');

router.get('/', verParametrosPublicos);

module.exports = router;