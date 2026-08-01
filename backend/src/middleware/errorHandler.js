// Centralized error handler. Every controller should call next(err) on
// failure rather than sending its own 500 — keeps error shape consistent
// for the frontend and for any future API consumer.
function notFound(req, res, next) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message;
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
