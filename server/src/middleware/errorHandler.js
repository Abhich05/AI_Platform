function notFound(req, res) {
  res.status(404).json({ error: 'NOT_FOUND', message: `Route ${req.originalUrl} not found` });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
  });
}

module.exports = { notFound, errorHandler };
