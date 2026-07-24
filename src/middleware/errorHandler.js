import { HTTP_STATUS } from '../constants/index.js';

export function errorHandler(err, req, res, _next) {
  console.error('❌ Unhandled error:', err.message);

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
