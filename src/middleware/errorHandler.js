const AppError = require('../utils/AppError');

exports.notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for ${field}: "${err.keyValue[field]}" already exists`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}: ${err.value}`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON in request body';
  }

  if (status === 500) console.error(err);
  if (status === 500 && process.env.NODE_ENV === 'production') message = 'Internal Server Error';

  res.status(status).json({ success: false, message, ...(errors && { errors }) });
};
