import multer from 'multer';

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'route_not_found', message: 'ไม่พบ API ที่เรียก' });
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: 'invalid_upload', message: error.message });
  }
  const status = Number(error.status || 500);
  if (status >= 500) console.error('Unhandled API error', error);
  return res.status(status).json({
    error: error.code || 'internal_error',
    message: status >= 500 ? 'ระบบขัดข้อง กรุณาลองใหม่ภายหลัง' : error.message,
  });
}

