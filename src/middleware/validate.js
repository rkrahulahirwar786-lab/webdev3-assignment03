const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// router.param handler - rejects malformed ObjectIds before hitting the DB
exports.validateId = (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError(`Invalid product id: ${id}`, 400));
  }
  next();
};

exports.validateCreate = (req, res, next) => {
  const missing = ['name', 'sku', 'category', 'price'].filter(
    (f) => req.body[f] === undefined || req.body[f] === ''
  );
  if (missing.length) {
    return next(new AppError(`Missing required field(s): ${missing.join(', ')}`, 400));
  }
  next();
};

exports.validateUpdate = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError('Request body cannot be empty', 400));
  }
  next();
};

exports.validateStockChange = (req, res, next) => {
  const { change } = req.body;
  if (typeof change !== 'number' || !Number.isInteger(change) || change === 0) {
    return next(
      new AppError('"change" must be a non-zero integer (positive = restock, negative = sale)', 400)
    );
  }
  next();
};
