const { cargaStockSchema } = require('../../schemas/admin/stock.schema');
const { bajaStockSchema } = require('../../schemas/admin/stock.schema');

const validarBajaStock = (req, res, next) => {
    const { value, error } = bajaStockSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: error.details[0].message });
    }
    req.body = value;
    next();
};
const validarCargaStock = (req, res, next) => {
    const { value, error } = cargaStockSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }
    req.body = value;
    next();
};

module.exports = { validarCargaStock, validarBajaStock };