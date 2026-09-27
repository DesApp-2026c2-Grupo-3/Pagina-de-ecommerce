const express = require('express');
const {
    autocompletar,
    detalleLugar,
    direccionDesdeCoordenadas,
} = require('../controllers/geoController');

const router = express.Router();

router.get('/autocompletar', autocompletar);
router.get('/detalle/:placeId', detalleLugar);
router.get('/reverse', direccionDesdeCoordenadas);

module.exports = router;
